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
