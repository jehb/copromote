/**
 * @swagger
 * /api/v1/social/{id}:
 *   put:
 *     summary: Update an existing social media post
 *     description: Update details of a social post.
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
 *       200:
 *         description: Updated social post.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Social post not found.
 *   delete:
 *     summary: Delete a social media post
 *     description: Soft delete an existing social post.
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
 *         description: Social post deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Social post not found.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";
import { logActivity } from "@/app/actions/activity-logs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentPost = await prisma.socialPost.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentPost) {
      return NextResponse.json({ error: "Social post not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, platform, scheduledDate, status, promotionPeriodId, reviewerId, eventId } = body;

    const updatedContent = content !== undefined ? content : currentPost.content;
    const updatedPlatform = platform !== undefined ? platform : currentPost.platform;
    const updatedScheduledDate = scheduledDate !== undefined ? (scheduledDate === null ? null : new Date(scheduledDate)) : currentPost.scheduledDate;
    const updatedStatus = status !== undefined ? status : currentPost.status;
    const updatedPromoPeriodId = promotionPeriodId !== undefined ? (promotionPeriodId === "none" ? null : promotionPeriodId) : currentPost.promotionPeriodId;
    const updatedReviewerId = reviewerId !== undefined ? (reviewerId === "none" ? null : reviewerId) : currentPost.reviewerId;
    const updatedEventId = eventId !== undefined ? (eventId === "none" ? null : eventId) : currentPost.eventId;

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        content: updatedContent,
        platform: updatedPlatform,
        scheduledDate: updatedScheduledDate,
        status: updatedStatus,
        promotionPeriodId: updatedPromoPeriodId,
        reviewerId: updatedReviewerId,
        eventId: updatedEventId,
      },
    });

    await logActivity("UPDATE", "SocialPost", id, `Updated ${updatedPlatform} post`, null, user.id);

    return NextResponse.json(post);
  } catch (e) {
    console.error("Error updating social post:", e);
    return NextResponse.json({ error: "Failed to update social post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentPost = await prisma.socialPost.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentPost) {
      return NextResponse.json({ error: "Social post not found" }, { status: 404 });
    }

    await prisma.socialPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await logActivity("DELETE", "SocialPost", id, `Soft deleted social post`, null, user.id);

    return NextResponse.json({ message: "Social post deleted successfully" });
  } catch (e) {
    console.error("Error deleting social post:", e);
    return NextResponse.json({ error: "Failed to delete social post" }, { status: 500 });
  }
}
