/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Retrieve a list of tasks
 *     description: Retrieve a paginated list of tasks from the Kanban board.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tasks.
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
    const tasks = await prisma.task.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { assignee: true, project: true }
    });
    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
