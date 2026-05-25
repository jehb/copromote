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
    const events = await prisma.event.findMany({
      take: 100,
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        locationId: true,
        seriesId: true,
        wordpressId: true,
        wordpressUrl: true,
        createdAt: true,
        updatedAt: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(events);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
