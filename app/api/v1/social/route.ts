/**
 * @swagger
 * /api/v1/social:
 *   get:
 *     summary: Retrieve a list of social media posts
 *     description: Retrieve drafted and scheduled social media posts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of social posts.
 *       401:
 *         description: Unauthorized.
 *   post:
 *     summary: Create a new social media post
 *     description: Create/Draft a new social media post.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - platform
 *             properties:
 *               content:
 *                 type: string
 *               platform:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, posted, failed]
 *               promotionPeriodId:
 *                 type: string
 *               reviewerId:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created social post.
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
    const posts = await prisma.socialPost.findMany({
      where: { deletedAt: null },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch social posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, platform, scheduledDate, status, promotionPeriodId, reviewerId, eventId } = body;

    if (!content || !platform) {
      return NextResponse.json({ error: "Missing required fields: content, platform" }, { status: 400 });
    }

    const post = await prisma.socialPost.create({
      data: {
        content,
        platform,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: status || "draft",
        promotionPeriodId: promotionPeriodId || null,
        reviewerId: reviewerId || null,
        eventId: eventId || null,
      },
    });

    await logActivity("CREATE", "SocialPost", post.id, `Created ${platform} post`, null, user.id);

    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    console.error("Error creating social post:", e);
    return NextResponse.json({ error: "Failed to create social post" }, { status: 500 });
  }
}

