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
 *   post:
 *     summary: Create a new organization
 *     description: Create a new vendor, partner, or community organization.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               externalBrand:
 *                 type: string
 *               primaryContactId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created organization.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";
import { logActivity } from "@/app/actions/activity-logs";

export async function GET(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  try {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      take: 100,
      orderBy: { name: "asc" },
      include: { primaryContact: true },
    });
    return NextResponse.json(organizations);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, category, description, website, externalBrand, primaryContactId } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Missing required fields: name, category" }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        category,
        description,
        website,
        externalBrand,
        primaryContactId: primaryContactId || null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await logActivity("CREATE", "Organization", organization.id, `Created organization: ${name}`, null, user.id);

    return NextResponse.json(organization, { status: 201 });
  } catch (e) {
    console.error("Error creating organization:", e);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}

