"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createApiKey, revokeApiKey } from "@/app/actions/api-keys";
import { toast } from "sonner";
import { Loader2, Trash2, Copy } from "lucide-react";

export function ApiKeysClient({ initialKeys }: { initialKeys: any[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      const res = await createApiKey(name);
      if (res.success) {
        setNewKey(res.key);
        setName("");
        toast.success("API Key generated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key? Any integrations using it will break.")) return;
    try {
      await revokeApiKey(id);
      toast.success("API Key revoked");
      if (newKey) setNewKey(null); // Clear revealed key just in case
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New API Key</CardTitle>
          <CardDescription>Create a new key to authenticate external applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">Key Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. MCP Server Integration" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Key
            </Button>
          </form>

          {newKey && (
            <div className="mt-6 p-4 bg-slate-50 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm text-amber-600 mb-1">Save your key now</h4>
                  <p className="text-sm text-slate-600 mb-2">This key will not be shown again.</p>
                  <code className="bg-slate-200 px-2 py-1 rounded text-sm font-mono break-all">{newKey}</code>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(newKey)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>Manage your existing API keys.</CardDescription>
        </CardHeader>
        <CardContent>
          {initialKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No API keys found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {key.key.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
