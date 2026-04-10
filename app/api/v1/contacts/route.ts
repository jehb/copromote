/**
 * @swagger
 * /api/v1/contacts:
 *   get:
 *     summary: Retrieve a list of contacts
 *     description: Retrieve CRM contacts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of contacts.
 *       401:
 *         description: Unauthorized.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const contacts = await prisma.contact.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
