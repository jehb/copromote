/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     description: Update details of a Kanban task.
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
 *               status:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assigneeId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated task.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Task not found.
 *   delete:
 *     summary: Delete a task
 *     description: Soft delete an existing Kanban task.
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
 *         description: Task deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Task not found.
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
    const currentTask = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, status, dueDate, assigneeId, projectId } = body;

    const updatedTitle = title !== undefined ? title : currentTask.title;
    const updatedDescription = description !== undefined ? description : currentTask.description;
    const updatedStatus = status !== undefined ? status : currentTask.status;
    const updatedDueDate = dueDate !== undefined ? (dueDate === null ? null : new Date(dueDate)) : currentTask.dueDate;
    const updatedAssigneeId = assigneeId !== undefined ? (assigneeId === "none" ? null : assigneeId) : currentTask.assigneeId;
    const updatedProjectId = projectId !== undefined ? (projectId === "none" ? null : projectId) : currentTask.projectId;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: updatedTitle,
        description: updatedDescription,
        status: updatedStatus,
        dueDate: updatedDueDate,
        assigneeId: updatedAssigneeId,
        projectId: updatedProjectId,
        updatedById: user.id,
      },
    });

    await logActivity("UPDATE", "Task", id, `Updated task: ${updatedTitle}`, null, user.id);

    return NextResponse.json(task);
  } catch (e) {
    console.error("Error updating task:", e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentTask = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await logActivity("DELETE", "Task", id, `Soft deleted task`, null, user.id);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (e) {
    console.error("Error deleting task:", e);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
