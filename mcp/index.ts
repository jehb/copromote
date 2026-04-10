import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PROMOTY_API_URL = process.env.PROMOTY_API_URL || "http://localhost:3000/api/v1";
const PROMOTY_API_KEY = process.env.PROMOTY_API_KEY;

if (!PROMOTY_API_KEY) {
  console.error("Please set PROMOTY_API_KEY in environment variables");
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: PROMOTY_API_URL,
  headers: {
    Authorization: `Bearer ${PROMOTY_API_KEY}`,
    "Content-Type": "application/json",
  },
});

const server = new Server(
  {
    name: "promoty-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_projects",
        description: "Retrieve all active Promoty projects",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_events",
        description: "Retrieve all upcoming Promoty calendar events",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_contacts",
        description: "Retrieve Promoty CRM contacts",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_tasks",
        description: "Retrieve active Kanban tasks",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_organizations",
        description: "Retrieve vendor and partner organizations",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_social_posts",
        description: "Retrieve drafted and scheduled social media posts",
        inputSchema: {
          type: "object",
          properties: {},
        },
      }
    ],
  };
});

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_projects") {
    try {
      const response = await apiClient.get("/projects");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching projects: ${e.message}` }], isError: true };
    }
  }

  if (request.params.name === "get_events") {
    try {
      const response = await apiClient.get("/events");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching events: ${e.message}` }], isError: true };
    }
  }

  if (request.params.name === "get_contacts") {
    try {
      const response = await apiClient.get("/contacts");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching contacts: ${e.message}` }], isError: true };
    }
  }

  if (request.params.name === "get_tasks") {
    try {
      const response = await apiClient.get("/tasks");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching tasks: ${e.message}` }], isError: true };
    }
  }

  if (request.params.name === "get_organizations") {
    try {
      const response = await apiClient.get("/organizations");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching organizations: ${e.message}` }], isError: true };
    }
  }

  if (request.params.name === "get_social_posts") {
    try {
      const response = await apiClient.get("/social");
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error fetching social posts: ${e.message}` }], isError: true };
    }
  }

  throw new Error("Tool not found");
});

// Run server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Promoty MCP Server running on stdio");
}

run().catch(console.error);
