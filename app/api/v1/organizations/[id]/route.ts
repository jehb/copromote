/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     summary: Update an existing organization
 *     description: Update details of an organization.
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
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               externalBrand:
 *                 type: string
 *               primaryContactId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated organization.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Organization not found.
 *   delete:
 *     summary: Delete an organization
 *     description: Soft delete an existing organization.
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
 *         description: Organization deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Organization not found.
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
    const currentOrg = await prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, category, description, website, externalBrand, primaryContactId } = body;

    const updatedName = name !== undefined ? name : currentOrg.name;
    const updatedCategory = category !== undefined ? category : currentOrg.category;
    const updatedDescription = description !== undefined ? description : currentOrg.description;
    const updatedWebsite = website !== undefined ? website : currentOrg.website;
    const updatedExternalBrand = externalBrand !== undefined ? externalBrand : currentOrg.externalBrand;
    const updatedPrimaryContactId = primaryContactId !== undefined ? (primaryContactId === "none" ? null : primaryContactId) : currentOrg.primaryContactId;

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: updatedName,
        category: updatedCategory,
        description: updatedDescription,
        website: updatedWebsite,
        externalBrand: updatedExternalBrand,
        primaryContactId: updatedPrimaryContactId,
        updatedById: user.id,
      },
    });

    await logActivity("UPDATE", "Organization", id, `Updated organization: ${updatedName}`, null, user.id);

    return NextResponse.json(organization);
  } catch (e) {
    console.error("Error updating organization:", e);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentOrg = await prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentOrg) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    await prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await logActivity("DELETE", "Organization", id, `Soft deleted organization`, null, user.id);

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (e) {
    console.error("Error deleting organization:", e);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}
