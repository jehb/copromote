/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update an existing event
 *     description: Update details of a calendar event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Updated event.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Event not found.
 *   delete:
 *     summary: Delete an event
 *     description: Soft delete an existing calendar event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Event not found.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";
import { logActivity } from "@/app/actions/activity-logs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentEvent = await prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

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

    // Use values if provided, otherwise fallback to existing values
    const updatedTitle = title !== undefined ? title : currentEvent.title;
    const updatedDescription = description !== undefined ? description : currentEvent.description;
    const updatedInternalNotes = internalNotes !== undefined ? internalNotes : currentEvent.internalNotes;
    const updatedStartTime = startTime !== undefined ? new Date(startTime) : currentEvent.startTime;
    const updatedEndTime = endTime !== undefined ? new Date(endTime) : currentEvent.endTime;
    const updatedStatus = status !== undefined ? status : currentEvent.status;
    const updatedLocationId = locationId !== undefined ? locationId : currentEvent.locationId;
    const updatedPrimaryContactId = primaryContactId !== undefined ? (primaryContactId === "none" ? null : primaryContactId) : currentEvent.primaryContactId;
    const updatedSeriesId = seriesId !== undefined ? (seriesId === "none" ? null : seriesId) : currentEvent.seriesId;
    const updatedWordpressId = wordpressId !== undefined ? wordpressId : currentEvent.wordpressId;
    const updatedWordpressUrl = wordpressUrl !== undefined ? wordpressUrl : currentEvent.wordpressUrl;

    // If locationId is updated, verify it exists
    if (locationId !== undefined) {
      const locationExists = await prisma.location.findUnique({ where: { id: locationId } });
      if (!locationExists) {
        return NextResponse.json({ error: `Location not found: ${locationId}` }, { status: 400 });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: updatedTitle,
        description: updatedDescription,
        internalNotes: updatedInternalNotes,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
        status: updatedStatus,
        locationId: updatedLocationId,
        primaryContactId: updatedPrimaryContactId,
        seriesId: updatedSeriesId,
        wordpressId: updatedWordpressId,
        wordpressUrl: updatedWordpressUrl,
        contacts: contactIds && Array.isArray(contactIds)
          ? { set: contactIds.map((cid: string) => ({ id: cid })) }
          : undefined,
        organizations: organizationIds && Array.isArray(organizationIds)
          ? { set: organizationIds.map((oid: string) => ({ id: oid })) }
          : undefined,
        products: productUpcs && Array.isArray(productUpcs)
          ? {
              deleteMany: {},
              create: productUpcs.map((upc: string) => ({ upc })),
            }
          : undefined,
        updatedById: user.id,
      },
    });

    await logActivity("UPDATE", "Event", id, `Updated event: ${updatedTitle}`, null, user.id);

    return NextResponse.json(event);
  } catch (e) {
    console.error("Error updating event:", e);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentEvent = await prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await logActivity("DELETE", "Event", id, `Soft deleted event`, null, user.id);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (e) {
    console.error("Error deleting event:", e);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
