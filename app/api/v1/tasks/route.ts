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
 *   post:
 *     summary: Create a new task
 *     description: Create a new Kanban task.
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: todo
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assigneeId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created task.
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
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { assignee: true, project: true }
    });
    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, status, dueDate, assigneeId, projectId } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "todo",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        projectId: projectId || null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    await logActivity("CREATE", "Task", task.id, `Created task: ${title}`, null, user.id);

    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    console.error("Error creating task:", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

