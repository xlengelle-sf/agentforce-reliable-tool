#!/usr/bin/env node

console.log('\x1b[34m============================================\x1b[0m');
console.log('\x1b[34m  AgentForce Reliable Tool Installation Complete \x1b[0m');
console.log('\x1b[34m============================================\x1b[0m');

console.log('\x1b[34mQuick Setup:\x1b[0m');
console.log('Run our configuration wizard to set up your client:');
console.log('\x1b[32mnpx agentforce-reliable-tool configure\x1b[0m');

console.log('\x1b[33mAvailable Tools:\x1b[0m');
console.log('- agentforce_authenticate: Authenticate with Salesforce');
console.log('- agentforce_create_session: Create a new agent session');
console.log('- agentforce_send_message: Send a message to the agent');
console.log('- agentforce_get_status: Check connection status');
console.log('- agentforce_reset: Reset the client');

console.log('\x1b[34mClaude Desktop Integration:\x1b[0m');
console.log('After configuring, add to your Claude Desktop config file:');
console.log('\x1b[32m{');
console.log('  "mcpServers": {');
console.log('    "agentforce": {');
console.log('      "command": "npx",');
console.log('      "args": ["agentforce-reliable-tool"]');
console.log('    }');
console.log('  }');
console.log('}\x1b[0m');

console.log('\x1b[34mServer Requirement:\x1b[0m');
console.log('This tool requires the AgentForce Reliable Server to be running:');
console.log('\x1b[32mnpm install -g agentforce-reliable-server\x1b[0m');
console.log('\x1b[32mnpx agentforce-reliable-server --direct\x1b[0m');