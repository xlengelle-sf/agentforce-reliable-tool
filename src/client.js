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

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const CONFIG_DIR = path.join(homedir(), '.agentforce-reliable-client');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

// Default config
const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:3001',
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
  }
}

// Load config
function loadConfig() {
  ensureConfigDir();
  
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(`${colors.red}Error loading config:${colors.reset}`, error.message);
    }
  }
  
  return { ...DEFAULT_CONFIG };
}

// Save config
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
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
    config.serverUrl = 'http://localhost:3001';
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
        'x-api-key': config.apiKey
      }
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
    console.error(`${colors.yellow}Please ensure the server is running at ${config.serverUrl}${colors.reset}`);
    console.error(`${colors.yellow}You can start it with: npx agentforce-reliable-server --direct${colors.reset}`);
  }
  
  rl.close();
}

// MCP Tool client functions
async function authenticateWithAgentForce() {
  try {
    const config = loadConfig();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_authenticate',
        args: {
          clientId: config.clientId,
          config: {
            sfBaseUrl: process.env.SF_BASE_URL || 'https://login.salesforce.com',
            apiUrl: process.env.SF_API_URL,
            agentId: process.env.SF_AGENT_ID,
            clientId: process.env.SF_CLIENT_ID,
            clientSecret: process.env.SF_CLIENT_SECRET,
            clientEmail: process.env.SF_CLIENT_EMAIL
          }
        }
      }
    }, {
      headers: {
        'x-api-key': config.apiKey
      }
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Authentication error:', error.message);
    throw error;
  }
}

async function createAgentForceSession() {
  try {
    const config = loadConfig();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_create_session',
        args: {
          clientId: config.clientId,
          config: {
            sfBaseUrl: process.env.SF_BASE_URL || 'https://login.salesforce.com',
            apiUrl: process.env.SF_API_URL,
            agentId: process.env.SF_AGENT_ID,
            clientId: process.env.SF_CLIENT_ID,
            clientSecret: process.env.SF_CLIENT_SECRET,
            clientEmail: process.env.SF_CLIENT_EMAIL
          }
        }
      }
    }, {
      headers: {
        'x-api-key': config.apiKey
      }
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Session creation error:', error.message);
    throw error;
  }
}

async function sendMessageToAgentForce(message) {
  try {
    const config = loadConfig();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_send_message',
        args: {
          clientId: config.clientId,
          config: {
            sfBaseUrl: process.env.SF_BASE_URL || 'https://login.salesforce.com',
            apiUrl: process.env.SF_API_URL,
            agentId: process.env.SF_AGENT_ID,
            clientId: process.env.SF_CLIENT_ID,
            clientSecret: process.env.SF_CLIENT_SECRET,
            clientEmail: process.env.SF_CLIENT_EMAIL
          },
          message
        }
      }
    }, {
      headers: {
        'x-api-key': config.apiKey
      }
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Message sending error:', error.message);
    throw error;
  }
}

async function getAgentForceStatus() {
  try {
    const config = loadConfig();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_get_status',
        args: {
          clientId: config.clientId
        }
      }
    }, {
      headers: {
        'x-api-key': config.apiKey
      }
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Status check error:', error.message);
    throw error;
  }
}

async function resetAgentForceClient() {
  try {
    const config = loadConfig();
    
    const response = await axios.post(`${config.serverUrl}/mcp/call-tool`, {
      tool: {
        name: 'agentforce_reset',
        args: {
          clientId: config.clientId
        }
      }
    }, {
      headers: {
        'x-api-key': config.apiKey
      }
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Reset error:', error.message);
    throw error;
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
        
        const request = JSON.parse(inputData);
        
        if (!request || !request.tool) {
          console.error('Error: Invalid request format');
          process.exit(1);
        }
        
        const { name, args } = request.tool;
        
        let result;
        
        switch (name) {
          case 'agentforce_authenticate':
            result = await authenticateWithAgentForce();
            break;
          
          case 'agentforce_create_session':
            result = await createAgentForceSession();
            break;
          
          case 'agentforce_send_message':
            result = await sendMessageToAgentForce(args.message);
            break;
          
          case 'agentforce_get_status':
            result = await getAgentForceStatus();
            break;
          
          case 'agentforce_reset':
            result = await resetAgentForceClient();
            break;
          
          default:
            console.error(`Error: Unknown tool: ${name}`);
            process.exit(1);
        }
        
        // Return result as JSON
        process.stdout.write(JSON.stringify({ result }));
        process.exit(0);
      } catch (error) {
        console.error('Error processing request:', error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error processing stdin:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
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