#!/usr/bin/env node

/**
 * AgentForce Reliable Tool Client
 * A reliable MCP client for connecting to AgentForce API through the reliable server
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { homedir } from 'os';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const CONFIG_DIR = path.join(homedir(), '.agentforce-reliable-client');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');
const LOG_PATH = path.join(LOGS_DIR, `client-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Default config
const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:3000',
  apiKey: '',
  clientId: `client-${Date.now()}`
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Setup logging
function setupLogging() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    
    // Create a write stream for the log file
    const logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
    
    // Override console methods to log to file
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    console.log = function(...args) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [INFO] ${args.join(' ')}\n`;
      logStream.write(logMessage);
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [ERROR] ${args.join(' ')}\n`;
      logStream.write(logMessage);
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [WARN] ${args.join(' ')}\n`;
      logStream.write(logMessage);
      originalConsoleWarn.apply(console, args);
    };
    
    console.info = function(...args) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [INFO] ${args.join(' ')}\n`;
      logStream.write(logMessage);
      originalConsoleInfo.apply(console, args);
    };
    
    // Log initial message
    console.log(`Logging initialized to ${LOG_PATH}`);
    
    // Setup cleanup on exit
    process.on('exit', () => {
      logStream.end();
    });
    
    return true;
  } catch (error) {
    console.error('Error setting up logging:', error.message);
    return false;
  }
}

// Prompt helper function
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(`Created config directory: ${CONFIG_DIR}`);
  }
}

// Load config
function loadConfig() {
  ensureConfigDir();
  
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      try {
        const config = JSON.parse(configData);
        console.log('Successfully loaded configuration');
        return config;
      } catch (parseError) {
        console.error(`${colors.red}Error parsing configuration:${colors.reset}`, parseError.message);
        console.error(`${colors.yellow}Raw config data:${colors.reset}`, configData);
        console.log('Using default configuration instead');
        return { ...DEFAULT_CONFIG };
      }
    } catch (error) {
      console.error(`${colors.red}Error loading config:${colors.reset}`, error.message);
    }
  } else {
    console.log('No configuration file found, using defaults');
  }
  
  return { ...DEFAULT_CONFIG };
}

// Save config
function saveConfig(config) {
  ensureConfigDir();
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`Configuration saved to ${CONFIG_PATH}`);
    return true;
  } catch (error) {
    console.error(`Error saving configuration: ${error.message}`);
    return false;
  }
}

// Configure the client
async function configureClient() {
  console.log(`${colors.blue}AgentForce Reliable Tool Configuration${colors.reset}`);
  console.log('');
  
  // Load existing config
  const config = loadConfig();
  
  console.log(`${colors.yellow}Enter your server connection details:${colors.reset}`);
  console.log('(Press Enter to keep existing values in brackets)');
  console.log('');
  
  // Server URL
  const serverUrl = await prompt(`Server URL ${config.serverUrl ? `[${config.serverUrl}]` : ''}: `);
  if (serverUrl) {
    config.serverUrl = serverUrl;
  } else if (!config.serverUrl) {
    config.serverUrl = 'http://localhost:3000';
  }
  
  // API Key
  const apiKey = await prompt(`Server API Key ${config.apiKey ? `[${config.apiKey.substring(0, 8)}...]` : ''}: `);
  if (apiKey) {
    config.apiKey = apiKey;
  }
  
  // Save config
  saveConfig(config);
  
  console.log('');
  console.log(`${colors.green}Configuration saved to ${CONFIG_PATH}${colors.reset}`);
  console.log('');
  
  // Verify connection
  try {
    console.log(`${colors.blue}Verifying connection to server...${colors.reset}`);
    
    const response = await axios.get(config.serverUrl, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': uuidv4()
      },
      timeout: 5000 // 5-second timeout
    });
    
    console.log(`${colors.green}✓ Connected to server: ${response.data.name} v${response.data.version}${colors.reset}`);
    console.log(`${colors.green}✓ Server status: ${response.data.status}${colors.reset}`);
    
    if (response.data.mode === 'direct') {
      console.log(`${colors.green}✓ Server running in direct mode${colors.reset}`);
    }
    
    console.log('');
    console.log(`${colors.blue}Claude Desktop Integration:${colors.reset}`);
    console.log('Add the following to your Claude Desktop config file:');
    console.log('');
    console.log(`${colors.yellow}{${colors.reset}`);
    console.log(`${colors.yellow}  "mcpServers": {${colors.reset}`);
    console.log(`${colors.yellow}    "agentforce": {${colors.reset}`);
    console.log(`${colors.yellow}      "command": "npx",${colors.reset}`);
    console.log(`${colors.yellow}      "args": ["agentforce-reliable-tool"]${colors.reset}`);
    console.log(`${colors.yellow}    }${colors.reset}`);
    console.log(`${colors.yellow}  }${colors.reset}`);
    console.log(`${colors.yellow}}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}✗ Error connecting to server:${colors.reset}`, error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`${colors.yellow}The server at ${config.serverUrl} is not running or not accessible${colors.reset}`);
      } else if (error.response) {
        console.error(`${colors.yellow}Server returned status code ${error.response.status}${colors.reset}`);
      } else if (error.request) {
        console.error(`${colors.yellow}No response received from server${colors.reset}`);
      }
    }
    
    console.error(`${colors.yellow}Please ensure the server is running at ${config.serverUrl}${colors.reset}`);
    console.error(`${colors.yellow}You can start it with: npx agentforce-reliable-server --direct${colors.reset}`);
  }
  
  rl.close();
}

// MCP Tool client functions
async function authenticateWithAgentForce(args) {
  console.log('Authenticating with AgentForce');
  console.log(`Client ID: ${args.clientId}`);
  console.log(`Agent ID: ${args.config.agentId}`);
  
  try {
    const config = loadConfig();
    const requestId = uuidv4();
    
    console.log(`Making request to: ${config.serverUrl}/mcp/call-tool`);
    console.log(`Request ID: ${requestId}`);
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_authenticate',
        args: args
      }
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': requestId,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30-second timeout
    });
    
    console.log('Authentication successful');
    return response.data.result;
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    // Return a properly formatted error result
    return {
      content: [{
        type: 'text',
        text: `Authentication failed: ${error.message}`
      }],
      error: {
        code: 'authentication_error',
        message: error.message
      }
    };
  }
}

async function createAgentForceSession(args) {
  console.log('Creating AgentForce session');
  console.log(`Client ID: ${args.clientId}`);
  
  try {
    const config = loadConfig();
    const requestId = uuidv4();
    
    console.log(`Making request to: ${config.serverUrl}/mcp/call-tool`);
    console.log(`Request ID: ${requestId}`);
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_create_session',
        args: args
      }
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': requestId,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60-second timeout
    });
    
    console.log('Session creation successful');
    return response.data.result;
  } catch (error) {
    console.error('Session creation error:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    // Return a properly formatted error result
    return {
      content: [{
        type: 'text',
        text: `Session creation failed: ${error.message}`
      }],
      error: {
        code: 'session_creation_error',
        message: error.message
      }
    };
  }
}

async function sendMessageToAgentForce(args) {
  console.log('Sending message to AgentForce');
  console.log(`Client ID: ${args.clientId}`);
  console.log(`Message length: ${args.message.length} characters`);
  
  try {
    const config = loadConfig();
    const requestId = uuidv4();
    
    console.log(`Making request to: ${config.serverUrl}/mcp/call-tool`);
    console.log(`Request ID: ${requestId}`);
    
    const startTime = Date.now();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_send_message',
        args: args
      }
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': requestId,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5-minute timeout
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Message sending successful, took ${responseTime}ms`);
    const responseText = response.data.result.content[0].text;
    console.log(`Response length: ${responseText.length} characters`);
    
    return response.data.result;
  } catch (error) {
    console.error('Message sending error:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    // Return a properly formatted error result
    return {
      content: [{
        type: 'text',
        text: `Message sending failed: ${error.message}`
      }],
      error: {
        code: 'message_sending_error',
        message: error.message
      }
    };
  }
}

async function getAgentForceStatus(args) {
  console.log('Getting AgentForce status');
  console.log(`Client ID: ${args.clientId}`);
  
  try {
    const config = loadConfig();
    const requestId = uuidv4();
    
    console.log(`Making request to: ${config.serverUrl}/mcp/call-tool`);
    console.log(`Request ID: ${requestId}`);
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_get_status',
        args: args
      }
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': requestId,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10-second timeout
    });
    
    console.log('Status check successful');
    return response.data.result;
  } catch (error) {
    console.error('Status check error:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    // Return a properly formatted error result
    return {
      content: [{
        type: 'text',
        text: `Status check failed: ${error.message}`
      }],
      error: {
        code: 'status_check_error',
        message: error.message
      }
    };
  }
}

async function resetAgentForceClient(args) {
  console.log('Resetting AgentForce client');
  console.log(`Client ID: ${args.clientId}`);
  
  try {
    const config = loadConfig();
    const requestId = uuidv4();
    
    console.log(`Making request to: ${config.serverUrl}/mcp/call-tool`);
    console.log(`Request ID: ${requestId}`);
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_reset',
        args: args
      }
    }, {
      headers: {
        'x-api-key': config.apiKey,
        'x-request-id': requestId,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10-second timeout
    });
    
    console.log('Reset successful');
    return response.data.result;
  } catch (error) {
    console.error('Reset error:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    // Return a properly formatted error result
    return {
      content: [{
        type: 'text',
        text: `Reset failed: ${error.message}`
      }],
      error: {
        code: 'reset_error',
        message: error.message
      }
    };
  }
}

// Process request from stdin (MCP standard)
async function processStdinRequest() {
  try {
    let inputData = '';
    
    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });
    
    process.stdin.on('end', async () => {
      try {
        if (!inputData.trim()) {
          console.error('Error: No input received');
          process.exit(1);
        }
        
        console.log(`Received input: ${inputData.length} characters`);
        
        let request;
        try {
          request = JSON.parse(inputData);
        } catch (parseError) {
          console.error('Error parsing input JSON:', parseError.message);
          process.stdout.write(JSON.stringify({
            result: {
              content: [{
                type: 'text',
                text: `Error: Failed to parse input - ${parseError.message}`
              }],
              error: {
                code: 'parse_error',
                message: parseError.message
              }
            }
          }));
          process.exit(1);
        }
        
        if (!request || !request.tool) {
          console.error('Error: Invalid request format - missing tool field');
          process.stdout.write(JSON.stringify({
            result: {
              content: [{
                type: 'text',
                text: 'Error: Invalid request format - missing tool field'
              }],
              error: {
                code: 'invalid_request',
                message: 'Missing tool field'
              }
            }
          }));
          process.exit(1);
        }
        
        const { name, args } = request.tool;
        console.log(`Tool called: ${name}`);
        
        if (!args) {
          console.error('Error: Invalid request format - missing args field');
          process.stdout.write(JSON.stringify({
            result: {
              content: [{
                type: 'text',
                text: 'Error: Invalid request format - missing args field'
              }],
              error: {
                code: 'invalid_request',
                message: 'Missing args field'
              }
            }
          }));
          process.exit(1);
        }
        
        let result;
        
        switch (name) {
          case 'agentforce_authenticate':
            result = await authenticateWithAgentForce(args);
            break;
          
          case 'agentforce_create_session':
            result = await createAgentForceSession(args);
            break;
          
          case 'agentforce_send_message':
            result = await sendMessageToAgentForce(args);
            break;
          
          case 'agentforce_get_status':
            result = await getAgentForceStatus(args);
            break;
          
          case 'agentforce_reset':
            result = await resetAgentForceClient(args);
            break;
          
          default:
            console.error(`Error: Unknown tool: ${name}`);
            process.stdout.write(JSON.stringify({
              result: {
                content: [{
                  type: 'text',
                  text: `Error: Unknown tool: ${name}`
                }],
                error: {
                  code: 'unknown_tool',
                  message: `Unknown tool: ${name}`
                }
              }
            }));
            process.exit(1);
        }
        
        console.log('Sending response');
        
        // Return result as JSON
        process.stdout.write(JSON.stringify({ result }));
        process.exit(0);
      } catch (error) {
        console.error('Error processing request:', error.message);
        console.error('Stack trace:', error.stack);
        
        process.stdout.write(JSON.stringify({
          result: {
            content: [{
              type: 'text',
              text: `Error: ${error.message}`
            }],
            error: {
              code: 'processing_error',
              message: error.message
            }
          }
        }));
        
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error processing stdin:', error.message);
    console.error('Stack trace:', error.stack);
    
    process.stdout.write(JSON.stringify({
      result: {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        error: {
          code: 'stdin_error',
          message: error.message
        }
      }
    }));
    
    process.exit(1);
  }
}

// Main function
async function main() {
  // Setup logging
  setupLogging();
  
  const args = process.argv.slice(2);
  
  // Handle configure command
  if (args.includes('configure')) {
    await configureClient();
    return;
  }
  
  // Standard MCP operation: read from stdin
  processStdinRequest();
}

// Run the main function
main();