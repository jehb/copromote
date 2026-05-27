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
 *   post:
 *     summary: Create a new contact
 *     description: Create a new CRM contact.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - type
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               notes:
 *                 type: string
 *               type:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created contact.
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
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { deletedAt: null },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, jobTitle, notes, type, organizationId } = body;

    if (!firstName || !lastName || !type) {
      return NextResponse.json({ error: "Missing required fields: firstName, lastName, type" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        jobTitle,
        notes,
        type,
        organizationId: organizationId || null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await logActivity("CREATE", "Contact", contact.id, `Created contact: ${firstName} ${lastName}`, null, user.id);

    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

