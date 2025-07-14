import express from 'express';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Since we're using ES modules in TypeScript, we need to import them properly
// We'll use dynamic imports for the TypeScript modules
const app = express();
const PORT = process.env.PORT || 3300;

app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Tutorial reader modules (will be loaded dynamically)
let readAllTutorials, readTutorialById;
let readTutorial, getStepByNumber;

// Load the ES modules
async function loadModules() {
  try {
    const allTutorialsModule = await import('./all-tutorials-reader.js');
    const tutorialModule = await import('./tutorial-reader.js');
    
    readAllTutorials = allTutorialsModule.readAllTutorials;
    readTutorialById = allTutorialsModule.readTutorialById;
    
    readTutorial = tutorialModule.readTutorial;
    getStepByNumber = tutorialModule.getStepByNumber;
    
    console.log('✅ Tutorial reader modules loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load tutorial reader modules:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tutorial server is running' });
});

// Get all tutorials (summaries only - from meta.json)
app.get('/api/tutorials', async (req, res) => {
  try {
    const basePath = resolve(__dirname, '../../'); // Look for tutorials in parent directory
    const allTutorials = await readAllTutorials(basePath);
    
    // Return only summary information from meta.json
    const summaries = allTutorials.tutorials.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      totalSteps: tutorial.totalSteps
    }));
    
    res.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    console.error('Error reading tutorials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read tutorials',
      message: error.message
    });
  }
});

// Get a specific tutorial by ID (from meta.json)
app.get('/api/tutorials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const basePath = resolve(__dirname, '../../');
    
    // Read all tutorials and find the one with matching ID from meta.json
    const allTutorials = await readAllTutorials(basePath);
    const tutorial = allTutorials.tutorials.find(t => t.id === id);
    
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      });
    }
    
    res.json({
      success: true,
      data: tutorial
    });
  } catch (error) {
    console.error('Error reading tutorial:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read tutorial',
      message: error.message
    });
  }
});

// Get a specific step from a tutorial (by meta.json ID)
app.get('/api/tutorials/:id/steps/:stepNumber', async (req, res) => {
  try {
    const { id, stepNumber } = req.params;
    const basePath = resolve(__dirname, '../../');
    
    // Find tutorial by meta.json ID
    const allTutorials = await readAllTutorials(basePath);
    const tutorial = allTutorials.tutorials.find(t => t.id === id);
    
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        error: 'Tutorial not found'
      });
    }
    
    const step = getStepByNumber(tutorial, parseInt(stepNumber, 10));
    
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'Step not found'
      });
    }
    
    res.json({
      success: true,
      data: step
    });
  } catch (error) {
    console.error('Error reading tutorial step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read tutorial step',
      message: error.message
    });
  }
});

// Read tutorial from content directory (for current tutorial)
app.get('/api/current-tutorial', async (req, res) => {
  try {
    const contentPath = resolve(__dirname, '../content');
    const tutorial = await readTutorial(contentPath);
    
    res.json({
      success: true,
      data: tutorial
    });
  } catch (error) {
    console.error('Error reading current tutorial:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read current tutorial',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  await loadModules();
  
  app.listen(PORT, () => {
    console.log(`🚀 Tutorial Server running on http://localhost:${PORT}`);
    console.log('📚 Available endpoints:');
    console.log('  GET /health - Health check');
    console.log('  GET /api/tutorials - Get tutorial summaries (from meta.json)');
    console.log('  GET /api/tutorials/:id - Get full tutorial details by meta.json ID');
    console.log('  GET /api/tutorials/:id/steps/:stepNumber - Get specific step by tutorial ID');
    console.log('  GET /api/current-tutorial - Get current tutorial from content directory');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 