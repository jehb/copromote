"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function generateKey() {
  return "promoty_" + randomBytes(32).toString("hex");
}

export async function createApiKey(name: string) {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error("Unauthorized");
  }

  const newKey = generateKey();
  
  await prisma.apiKey.create({
    data: {
      name,
      key: newKey,
      userId: session.id,
    },
  });

  revalidatePath("/admin/settings/api-keys");
  return { success: true, key: newKey };
}

export async function revokeApiKey(id: string) {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error("Unauthorized");
  }

  await prisma.apiKey.delete({
    where: { id },
  });

  revalidatePath("/admin/settings/api-keys");
  return { success: true };
}

export async function getApiKeys() {
  const session = await getSession();
  if (!session || !session.id) return [];

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  
  return keys;
}
