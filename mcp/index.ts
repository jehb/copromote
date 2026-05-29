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
      // original read tools
      {
        name: "get_projects",
        description: "Retrieve all active Promoty projects",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_events",
        description: "Retrieve all upcoming Promoty calendar events",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_contacts",
        description: "Retrieve Promoty CRM contacts",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_tasks",
        description: "Retrieve active Kanban tasks",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_organizations",
        description: "Retrieve vendor and partner organizations",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_social_posts",
        description: "Retrieve drafted and scheduled social media posts",
        inputSchema: { type: "object", properties: {} },
      },

      // Project write tools
      {
        name: "create_project",
        description: "Create a new Promoty project",
        inputSchema: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", description: "Project name" },
            description: { type: "string", description: "Project description" },
            startDate: { type: "string", description: "ISO 8601 start date" },
            endDate: { type: "string", description: "ISO 8601 end date" },
          },
        },
      },
      {
        name: "update_project",
        description: "Update details of a project",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Project UUID" },
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
          },
        },
      },
      {
        name: "delete_project",
        description: "Soft delete a project",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Project UUID" },
          },
        },
      },

      // Task write tools
      {
        name: "create_task",
        description: "Create a new Kanban task",
        inputSchema: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            status: { type: "string", description: "Task status (e.g. todo, progress, done)" },
            dueDate: { type: "string", description: "ISO 8601 due date" },
            assigneeId: { type: "string", description: "User UUID to assign" },
            projectId: { type: "string", description: "Project UUID to associate" },
          },
        },
      },
      {
        name: "update_task",
        description: "Update details of a Kanban task",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Task UUID" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            dueDate: { type: "string" },
            assigneeId: { type: "string" },
            projectId: { type: "string" },
          },
        },
      },
      {
        name: "delete_task",
        description: "Soft delete a Kanban task",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Task UUID" },
          },
        },
      },

      // Event write tools
      {
        name: "create_event",
        description: "Create a new calendar event",
        inputSchema: {
          type: "object",
          required: ["title", "startTime", "endTime", "locationId"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            internalNotes: { type: "string" },
            startTime: { type: "string", description: "ISO 8601 start date-time" },
            endTime: { type: "string", description: "ISO 8601 end date-time" },
            status: { type: "string", description: "TENTATIVE, SCHEDULED, PAST, CANCELED" },
            locationId: { type: "string", description: "Location UUID" },
            primaryContactId: { type: "string", description: "Primary contact User UUID" },
            seriesId: { type: "string", description: "Event series UUID" },
            wordpressId: { type: "integer" },
            wordpressUrl: { type: "string" },
            contactIds: { type: "array", items: { type: "string" }, description: "Array of CRM Contact UUIDs" },
            organizationIds: { type: "array", items: { type: "string" }, description: "Array of Organization UUIDs" },
            productUpcs: { type: "array", items: { type: "string" }, description: "Array of Product UPC strings" },
          },
        },
      },
      {
        name: "update_event",
        description: "Update details of a calendar event",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Event UUID" },
            title: { type: "string" },
            description: { type: "string" },
            internalNotes: { type: "string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            status: { type: "string" },
            locationId: { type: "string" },
            primaryContactId: { type: "string" },
            seriesId: { type: "string" },
            wordpressId: { type: "integer" },
            wordpressUrl: { type: "string" },
            contactIds: { type: "array", items: { type: "string" } },
            organizationIds: { type: "array", items: { type: "string" } },
            productUpcs: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        name: "delete_event",
        description: "Soft delete a calendar event",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Event UUID" },
          },
        },
      },

      // Contact write tools
      {
        name: "create_contact",
        description: "Create a new CRM contact",
        inputSchema: {
          type: "object",
          required: ["firstName", "lastName", "type"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            company: { type: "string" },
            jobTitle: { type: "string" },
            notes: { type: "string" },
            type: { type: "string", description: "Internal or Partner" },
            organizationId: { type: "string", description: "Organization UUID" },
          },
        },
      },
      {
        name: "update_contact",
        description: "Update details of a CRM contact",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Contact UUID" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            company: { type: "string" },
            jobTitle: { type: "string" },
            notes: { type: "string" },
            type: { type: "string" },
            organizationId: { type: "string" },
          },
        },
      },
      {
        name: "delete_contact",
        description: "Soft delete a CRM contact",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Contact UUID" },
          },
        },
      },

      // Organization write tools
      {
        name: "create_organization",
        description: "Create a new organization",
        inputSchema: {
          type: "object",
          required: ["name", "category"],
          properties: {
            name: { type: "string" },
            category: { type: "string", description: "Vendor, Partner, or Non-Profit" },
            description: { type: "string" },
            website: { type: "string" },
            externalBrand: { type: "string" },
            primaryContactId: { type: "string", description: "Contact UUID" },
          },
        },
      },
      {
        name: "update_organization",
        description: "Update details of an organization",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Organization UUID" },
            name: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            website: { type: "string" },
            externalBrand: { type: "string" },
            primaryContactId: { type: "string" },
          },
        },
      },
      {
        name: "delete_organization",
        description: "Soft delete an organization",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Organization UUID" },
          },
        },
      },

      // Social Post write tools
      {
        name: "create_social_post",
        description: "Create/Draft a new social media post",
        inputSchema: {
          type: "object",
          required: ["content", "platform"],
          properties: {
            content: { type: "string", description: "Post content text" },
            platform: { type: "string", description: "Twitter, Instagram, etc." },
            scheduledDate: { type: "string", description: "ISO 8601 schedule date-time" },
            status: { type: "string", description: "draft, scheduled, posted, failed" },
            promotionPeriodId: { type: "string", description: "Promotion period UUID" },
            reviewerId: { type: "string", description: "User UUID who reviews" },
            eventId: { type: "string", description: "Event UUID to associate" },
          },
        },
      },
      {
        name: "update_social_post",
        description: "Update details of a social post",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Social post UUID" },
            content: { type: "string" },
            platform: { type: "string" },
            scheduledDate: { type: "string" },
            status: { type: "string" },
            promotionPeriodId: { type: "string" },
            reviewerId: { type: "string" },
            eventId: { type: "string" },
          },
        },
      },
      {
        name: "delete_social_post",
        description: "Soft delete a social media post",
        inputSchema: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Social post UUID" },
          },
        },
      },
    ],
  };
});

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = (request.params.arguments || {}) as any;

  try {
    // ------------------ READ TOOLS ------------------
    if (toolName === "get_projects") {
      const response = await apiClient.get("/projects");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "get_events") {
      const response = await apiClient.get("/events");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "get_contacts") {
      const response = await apiClient.get("/contacts");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "get_tasks") {
      const response = await apiClient.get("/tasks");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "get_organizations") {
      const response = await apiClient.get("/organizations");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "get_social_posts") {
      const response = await apiClient.get("/social");
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ PROJECT WRITE TOOLS ------------------
    if (toolName === "create_project") {
      const response = await apiClient.post("/projects", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_project") {
      const response = await apiClient.put(`/projects/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_project") {
      const response = await apiClient.delete(`/projects/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ TASK WRITE TOOLS ------------------
    if (toolName === "create_task") {
      const response = await apiClient.post("/tasks", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_task") {
      const response = await apiClient.put(`/tasks/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_task") {
      const response = await apiClient.delete(`/tasks/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ EVENT WRITE TOOLS ------------------
    if (toolName === "create_event") {
      const response = await apiClient.post("/events", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_event") {
      const response = await apiClient.put(`/events/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_event") {
      const response = await apiClient.delete(`/events/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ CONTACT WRITE TOOLS ------------------
    if (toolName === "create_contact") {
      const response = await apiClient.post("/contacts", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_contact") {
      const response = await apiClient.put(`/contacts/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_contact") {
      const response = await apiClient.delete(`/contacts/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ ORGANIZATION WRITE TOOLS ------------------
    if (toolName === "create_organization") {
      const response = await apiClient.post("/organizations", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_organization") {
      const response = await apiClient.put(`/organizations/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_organization") {
      const response = await apiClient.delete(`/organizations/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    // ------------------ SOCIAL POST WRITE TOOLS ------------------
    if (toolName === "create_social_post") {
      const response = await apiClient.post("/social", args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "update_social_post") {
      const response = await apiClient.put(`/social/${args.id}`, args);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    if (toolName === "delete_social_post") {
      const response = await apiClient.delete(`/social/${args.id}`);
      return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
    }

    throw new Error("Tool not found");
  } catch (e: any) {
    const errorMsg = e.response?.data?.error || e.message;
    return {
      content: [{ type: "text", text: `Error calling tool ${toolName}: ${errorMsg}` }],
      isError: true,
    };
  }
});

// Run server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Promoty MCP Server running on stdio");
}

run().catch(console.error);
