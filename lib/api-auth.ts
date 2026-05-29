import { NextRequest } from "next/server";
import { prisma } from "./db";

export async function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!apiKey) {
    return { user: null, error: "Missing or invalid Authorization header/API key" };
  }

  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!apiKeyRecord) {
      return { user: null, error: "Invalid API Key" };
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return { user: null, error: "API Key expired" };
    }

    // Update last used timestamp asynchronously
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(console.error);

    return { user: apiKeyRecord.user, error: null };
  } catch (error) {
    console.error("API Auth Error:", error);
    return { user: null, error: "Internal Server Error" };
  }
}
