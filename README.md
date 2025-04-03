# 🔌 AgentForce Reliable Tool

[![npm version](https://img.shields.io/npm/v/agentforce-reliable-tool.svg)](https://www.npmjs.com/package/agentforce-reliable-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A reliable MCP-compliant client tool for connecting to Salesforce AgentForce API via the AgentForce Reliable Server.

## 🎯 Features

- **No SDK dependency issues** - Doesn't rely on problematic MCP SDK
- **Simple configuration** - Easy setup with interactive wizard
- **Full MCP compatibility** - Works seamlessly with Claude Desktop
- **Secure credential handling** - Environment variable support
- **Reliable communication** - Works with the AgentForce Reliable Server

## 📦 Installation

```bash
# Install globally
npm install -g agentforce-reliable-tool

# Configure the client
npx agentforce-reliable-tool configure
```

## 🚀 Quick Start

### 1. Install and start the AgentForce Reliable Server

```bash
# Install the server
npm install -g agentforce-reliable-server

# Configure the server
npx agentforce-reliable-server configure

# Start the server in direct mode
npx agentforce-reliable-server --direct
```

### 2. Configure the AgentForce Reliable Tool

```bash
npx agentforce-reliable-tool configure
```

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:
```json
{
  "mcpServers": {
    "agentforce": {
      "command": "npx",
      "args": ["agentforce-reliable-tool"]
    }
  }
}
```

### 4. Set up environment variables

Create a `.env` file or set these environment variables:
```
SF_BASE_URL=https://login.salesforce.com
SF_API_URL=https://your-domain.my.salesforce.com
SF_AGENT_ID=your-agent-id
SF_CLIENT_ID=your-client-id
SF_CLIENT_SECRET=your-client-secret
SF_CLIENT_EMAIL=your-client-email
```

## 🔒 Security

- Secure credential handling via environment variables
- Local configuration file only stores server connection details
- Communication secured by server API key

## 🛠️ Tools

The client provides the following MCP-compatible tools:

- `agentforce_authenticate`: Authenticate with Salesforce
- `agentforce_create_session`: Create a new agent session
- `agentforce_send_message`: Send a message to the agent
- `agentforce_get_status`: Check connection status
- `agentforce_reset`: Reset the client

## 🐛 Troubleshooting

### Can't connect to server

If you see:
```
Error connecting to server
```

Ensure the server is running:
```bash
npx agentforce-reliable-server --direct
```

### Authentication failures

Check that your environment variables are correctly set:
```bash
echo $SF_CLIENT_ID
echo $SF_CLIENT_SECRET
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.