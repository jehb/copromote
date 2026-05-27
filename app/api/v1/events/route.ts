/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Retrieve a list of events
 *     description: Retrieve a list of upcoming calendar events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of events.
 *       401:
 *         description: Unauthorized.
 *   post:
 *     summary: Create a new event
 *     description: Create a new calendar event.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *               - locationId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               internalNotes:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [TENTATIVE, SCHEDULED, PAST, CANCELED]
 *               locationId:
 *                 type: string
 *               primaryContactId:
 *                 type: string
 *               seriesId:
 *                 type: string
 *               wordpressId:
 *                 type: integer
 *               wordpressUrl:
 *                 type: string
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               organizationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               productUpcs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created event.
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
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
      take: 100,
      orderBy: { startTime: "asc" },
      include: { location: true },
    });
    return NextResponse.json(events);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      internalNotes,
      startTime,
      endTime,
      status,
      locationId,
      primaryContactId,
      seriesId,
      wordpressId,
      wordpressUrl,
      contactIds,
      organizationIds,
      productUpcs,
    } = body;

    if (!title || !startTime || !endTime || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields: title, startTime, endTime, locationId" },
        { status: 400 }
      );
    }

    // Verify locationId exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      return NextResponse.json({ error: `Location not found: ${locationId}` }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        internalNotes,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || "SCHEDULED",
        locationId,
        primaryContactId: primaryContactId || null,
        seriesId: seriesId || null,
        wordpressId: wordpressId !== undefined ? wordpressId : null,
        wordpressUrl: wordpressUrl || null,
        contacts: contactIds && Array.isArray(contactIds)
          ? { connect: contactIds.map((id: string) => ({ id })) }
          : undefined,
        organizations: organizationIds && Array.isArray(organizationIds)
          ? { connect: organizationIds.map((id: string) => ({ id })) }
          : undefined,
        products: productUpcs && Array.isArray(productUpcs)
          ? { create: productUpcs.map((upc: string) => ({ upc })) }
          : undefined,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await logActivity("CREATE", "Event", event.id, `Created event: ${title}`, null, user.id);

    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    console.error("Error creating event:", e);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

