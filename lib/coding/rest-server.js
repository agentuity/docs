const express = require('express');
const { spawn } = require('child_process');
const { writeFile, unlink } = require('fs/promises');
const { join } = require('path');
const { tmpdir } = require('os');

class CodingRestServer {
  constructor(port = 8083) {
    this.port = port;
    this.app = express();
    
    // Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    this.setupRoutes();
    
    this.app.listen(port, () => {
      console.log(`Coding REST server running on port ${port}`);
      console.log('Note: Using direct Python execution');
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'coding-rest-server'
      });
    });

    // Execute code endpoint
    this.app.post('/execute', async (req, res) => {
      try {
        const { code } = req.body;
        
        if (!code) {
          return res.status(400).json({
            success: false,
            error: 'Code is required in request body',
            timestamp: new Date().toISOString()
          });
        }

        console.log('Executing code:', code);
        const result = await this.executeCode(code);
        res.json(result);
        
      } catch (error) {
        console.error('Error in execute endpoint:', error);
        res.status(500).json({
          success: false,
          error: `Server error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get server info
    this.app.get('/info', (req, res) => {
      res.json({
        service: 'coding-rest-server',
        version: '1.0.0',
        supportedLanguages: ['python'],
        maxExecutionTime: '10 seconds',
        timestamp: new Date().toISOString()
      });
    });
  }

  async executeCode(code) {
    return new Promise(async (resolve) => {
      try {
        // Create temporary file
        const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`;
        const tempFilePath = join(tmpdir(), tempFileName);
        
        await writeFile(tempFilePath, code);
        console.log(`Running Python file: ${tempFilePath}`);
        
        // Execute Python directly
        const python = spawn('python3', [tempFilePath]);
        
        let stdout = '';
        let stderr = '';
        let isResolved = false;

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', async (code) => {
          if (isResolved) return;
          isResolved = true;
          
          console.log(`Execution completed with code: ${code}`);
          console.log(`Output: ${stdout}`);
          if (stderr) console.log(`Error: ${stderr}`);
          
          // Clean up temp file
          try {
            await unlink(tempFilePath);
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
          
          resolve({
            success: code === 0,
            output: stdout,
            error: stderr,
            exitCode: code,
            timestamp: new Date().toISOString()
          });
        });

        python.on('error', async (error) => {
          if (isResolved) return;
          isResolved = true;
          
          console.error('Python execution error:', error);
          
          // Clean up temp file
          try {
            await unlink(tempFilePath);
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
          
          resolve({
            success: false,
            error: `Execution failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        });

        // Set timeout to prevent hanging
        setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          python.kill();
          resolve({
            success: false,
            error: 'Execution timeout (10 seconds)',
            timestamp: new Date().toISOString()
          });
        }, 10000);
        
      } catch (error) {
        console.error('Error setting up execution:', error);
        resolve({
          success: false,
          error: `Setup failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}

// Export the class and create a singleton instance
const codingRestServer = new CodingRestServer(8083);
module.exports = { CodingRestServer, codingRestServer }; 