/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Retrieve a list of organizations
 *     description: Retrieve a list of vendors, partners, and community organizations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of organizations.
 *       401:
 *         description: Unauthorized.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  try {
    const organizations = await prisma.organization.findMany({
      take: 100,
      orderBy: { name: "asc" },
      include: { primaryContact: true },
    });
    return NextResponse.json(organizations);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}
