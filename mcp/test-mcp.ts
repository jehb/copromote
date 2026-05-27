import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "dist/index.js");

console.log(`Starting MCP Server verification test at: ${serverPath}`);

const child = spawn("node", [serverPath], {
  env: {
    ...process.env,
    PROMOTY_API_KEY: "test-api-key",
    PROMOTY_API_URL: "http://localhost:3000/api/v1",
  },
});

let buffer = "";
let hasFailed = false;

// Timeout after 8 seconds
const timeout = setTimeout(() => {
  console.error("FAIL: Verification test timed out after 8 seconds");
  cleanup(1);
}, 8000);

function cleanup(code: number) {
  clearTimeout(timeout);
  child.kill();
  process.exit(code);
}

function send(msg: any) {
  const jsonStr = JSON.stringify(msg) + "\n";
  console.log(`[Client -> Server] ${jsonStr.trim()}`);
  child.stdin.write(jsonStr);
}

function handleMessage(line: string) {
  console.log(`[Server -> Client] ${line}`);
  try {
    const msg = JSON.parse(line);
    
    // Check if it's the initialize response
    if (msg.id === 1) {
      if (msg.error) {
        console.error("FAIL: Initialize returned error", msg.error);
        cleanup(1);
        return;
      }
      
      console.log("SUCCESS: Initialized successfully. Sending initialized notification and tools/list request...");
      // Send notifications/initialized
      send({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      });
      
      // Send tools/list
      send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      });
    }
    
    // Check if it's the tools/list response
    else if (msg.id === 2) {
      if (msg.error) {
        console.error("FAIL: tools/list returned error", msg.error);
        cleanup(1);
        return;
      }
      
      const tools = msg.result?.tools;
      if (!Array.isArray(tools)) {
        console.error("FAIL: tools/list result.tools is not an array");
        cleanup(1);
        return;
      }
      
      console.log(`\nFound ${tools.length} registered tools.`);
      
      // Expected tool list
      const expectedTools = [
        "get_projects", "get_events", "get_contacts", "get_tasks", "get_organizations", "get_social_posts",
        "create_project", "update_project", "delete_project",
        "create_task", "update_task", "delete_task",
        "create_event", "update_event", "delete_event",
        "create_contact", "update_contact", "delete_contact",
        "create_organization", "update_organization", "delete_organization",
        "create_social_post", "update_social_post", "delete_social_post"
      ];
      
      const toolNames = tools.map((t: any) => t.name);
      
      // Check if all expected tools are present
      const missingTools = expectedTools.filter(name => !toolNames.includes(name));
      if (missingTools.length > 0) {
        console.error(`FAIL: Missing expected tools: ${missingTools.join(", ")}`);
        cleanup(1);
        return;
      }
      
      console.log("SUCCESS: All 24 expected tools are registered!");
      
      // Verify Social Post schemas
      const createSocialPostTool = tools.find((t: any) => t.name === "create_social_post");
      const properties = createSocialPostTool?.inputSchema?.properties || {};
      
      console.log("Verifying field name alignment for social posts:");
      console.log(`- content: ${properties.content ? "PRESENT (Correct)" : "MISSING (Incorrect)"}`);
      console.log(`- text: ${properties.text ? "PRESENT (Incorrect)" : "MISSING (Correct)"}`);
      console.log(`- scheduledDate: ${properties.scheduledDate ? "PRESENT (Correct)" : "MISSING (Incorrect)"}`);
      console.log(`- scheduledFor: ${properties.scheduledFor ? "PRESENT (Incorrect)" : "MISSING (Correct)"}`);
      
      if (!properties.content || properties.text || !properties.scheduledDate || properties.scheduledFor) {
        console.error("FAIL: Social post schema does not align with database/API fields");
        cleanup(1);
        return;
      }
      
      // Verify Event schemas
      const createEventTool = tools.find((t: any) => t.name === "create_event");
      const eventProperties = createEventTool?.inputSchema?.properties || {};
      
      console.log("Verifying field name alignment for calendar events:");
      console.log(`- startTime: ${eventProperties.startTime ? "PRESENT (Correct)" : "MISSING (Incorrect)"}`);
      console.log(`- endTime: ${eventProperties.endTime ? "PRESENT (Correct)" : "MISSING (Incorrect)"}`);
      console.log(`- startDate: ${eventProperties.startDate ? "PRESENT (Incorrect)" : "MISSING (Correct)"}`);
      console.log(`- endDate: ${eventProperties.endDate ? "PRESENT (Incorrect)" : "MISSING (Correct)"}`);
      
      if (!eventProperties.startTime || !eventProperties.endTime || eventProperties.startDate || eventProperties.endDate) {
        console.error("FAIL: Event schema does not align with database/API fields");
        cleanup(1);
        return;
      }
      
      console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
      cleanup(0);
    }
  } catch (err: any) {
    console.error("FAIL: Failed to parse line from server", err);
    cleanup(1);
  }
}

child.stdout.on("data", (data) => {
  buffer += data.toString();
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line) {
      handleMessage(line);
    }
  }
});

child.stderr.on("data", (data) => {
  console.log(`[Server Stderr] ${data.toString().trim()}`);
});

child.on("close", (code) => {
  console.log(`Server child process exited with code ${code}`);
  if (code !== 0 && !hasFailed) {
    process.exit(code || 1);
  }
});

// Start testing by sending initialize request
send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0",
    },
  },
});
