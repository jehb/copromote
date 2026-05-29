/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update an existing project
 *     description: Update details of a project.
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Updated project.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Project not found.
 *   delete:
 *     summary: Delete a project
 *     description: Soft delete an existing project.
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
 *         description: Project deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Project not found.
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
    const currentProject = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, status, startDate, endDate } = body;

    const updatedName = name !== undefined ? name : currentProject.name;
    const updatedDescription = description !== undefined ? description : currentProject.description;
    const updatedStatus = status !== undefined ? status : currentProject.status;
    const updatedStartDate = startDate !== undefined ? new Date(startDate) : currentProject.startDate;
    const updatedEndDate = endDate !== undefined ? (endDate === null ? null : new Date(endDate)) : currentProject.endDate;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: updatedName,
        description: updatedDescription,
        status: updatedStatus,
        startDate: updatedStartDate,
        endDate: updatedEndDate,
        updatedById: user.id,
      },
    });

    await logActivity("UPDATE", "Project", id, `Updated project: ${updatedName}`, null, user.id);

    return NextResponse.json(project);
  } catch (e) {
    console.error("Error updating project:", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentProject = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await logActivity("DELETE", "Project", id, `Soft deleted project`, null, user.id);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (e) {
    console.error("Error deleting project:", e);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
