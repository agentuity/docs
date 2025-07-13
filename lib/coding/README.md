# Coding REST Server

A simple REST API server for executing Python code safely. This is an MVP implementation that creates temporary files and executes them using the system's Python interpreter.

## Features

- Execute Python code via REST API
- 10-second execution timeout
- Automatic cleanup of temporary files
- CORS enabled for development
- Health check endpoint
- Server info endpoint

## Installation

Make sure you have the required dependencies:

```bash
npm install express axios
```

Also ensure you have Python 3 installed on your system:

```bash
python3 --version
```

## Usage

### Start the Server

```javascript
const { codingRestServer } = require('./rest-server');
// Server automatically starts on port 8083
```

Or run it directly:

```bash
node lib/coding/rest-server.js
```

Or use the npm script:

```bash
npm run coding-server
```

For full development (with terminal server and Next.js):

```bash
npm run dev:full
```

### API Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "coding-rest-server"
}
```

#### `GET /info`
Get server information.

**Response:**
```json
{
  "service": "coding-rest-server",
  "version": "1.0.0",
  "supportedLanguages": ["python"],
  "maxExecutionTime": "10 seconds",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `POST /execute`
Execute Python code.

**Request Body:**
```json
{
  "code": "print('Hello, World!')\nprint(2 + 2)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "output": "Hello, World!\n4\n",
  "error": "",
  "exitCode": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "output": "",
  "error": "NameError: name 'undefined_var' is not defined",
  "exitCode": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Example Usage

### Using cURL

```bash
# Health check
curl http://localhost:8083/health

# Execute Python code
curl -X POST http://localhost:8083/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello from cURL!\")\nprint(5 * 5)"}'
```

### Using JavaScript (Node.js)

```javascript
const axios = require('axios');

async function executeCode() {
  try {
    const response = await axios.post('http://localhost:8083/execute', {
      code: `
        import math
        print(f"Square root of 16: {math.sqrt(16)}")
        print(f"Pi value: {math.pi}")
      `
    });
    console.log('Result:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

executeCode();
```

### Using JavaScript (Browser)

```javascript
async function executeCode() {
  try {
    const response = await fetch('http://localhost:8083/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'print("Hello from browser!")\nprint("Current time:", __import__("datetime").datetime.now())'
      })
    });
    
    const result = await response.json();
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

executeCode();
```

## Testing

Run the example tests:

```bash
node rest-server-example.js
```

## Security Notes

⚠️ **Important**: This is an MVP implementation for development/testing purposes. For production use, consider:

- Input validation and sanitization
- Rate limiting
- Authentication/authorization
- Sandboxing (Docker containers)
- Resource limits (memory, CPU)
- Code analysis for malicious patterns
- Logging and monitoring

## File Structure

```
lib/coding/
├── rest-server.js          # Main REST server implementation
├── rest-server-example.js  # Example usage and tests
└── README.md              # This documentation
```

## Configuration

The server runs on port 8083 by default. You can change this by modifying the port in the constructor:

```javascript
const codingRestServer = new CodingRestServer(3000); // Custom port
```

## Troubleshooting

### "python3: command not found"
Make sure Python 3 is installed and accessible via `python3` command.

### Port already in use
Change the port number in the server configuration or kill the process using the port.

### CORS issues
The server includes CORS headers for development. For production, configure CORS properly for your domain. 