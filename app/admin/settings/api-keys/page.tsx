import { getApiKeys } from "@/app/actions/api-keys";
import { ApiKeysClient } from "./client";

export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">API Keys</h1>
      <p className="text-muted-foreground">
        Manage API keys used to access the Promoty REST API and MCP Server integrations.
      </p>
      
      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}
