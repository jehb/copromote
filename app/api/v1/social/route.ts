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
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

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
