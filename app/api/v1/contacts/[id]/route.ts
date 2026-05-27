/**
 * @swagger
 * /api/v1/contacts/{id}:
 *   put:
 *     summary: Update an existing contact
 *     description: Update details of a contact.
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               notes:
 *                 type: string
 *               type:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated contact.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Contact not found.
 *   delete:
 *     summary: Delete a contact
 *     description: Soft delete an existing contact.
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
 *         description: Contact deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Contact not found.
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
    const currentContact = await prisma.contact.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, company, jobTitle, notes, type, organizationId } = body;

    // Use values if provided, otherwise fallback to existing values
    const updatedFirstName = firstName !== undefined ? firstName : currentContact.firstName;
    const updatedLastName = lastName !== undefined ? lastName : currentContact.lastName;
    const updatedEmail = email !== undefined ? email : currentContact.email;
    const updatedPhone = phone !== undefined ? phone : currentContact.phone;
    const updatedCompany = company !== undefined ? company : currentContact.company;
    const updatedJobTitle = jobTitle !== undefined ? jobTitle : currentContact.jobTitle;
    const updatedNotes = notes !== undefined ? notes : currentContact.notes;
    const updatedType = type !== undefined ? type : currentContact.type;
    const updatedOrgId = organizationId !== undefined ? (organizationId === "none" ? null : organizationId) : currentContact.organizationId;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: updatedEmail,
        phone: updatedPhone,
        company: updatedCompany,
        jobTitle: updatedJobTitle,
        notes: updatedNotes,
        type: updatedType,
        organizationId: updatedOrgId,
        updatedById: user.id,
      },
    });

    // Compute changes for audit logging
    const changes: Record<string, { from: any; to: any }> = {};
    if (currentContact.firstName !== updatedFirstName) changes.firstName = { from: currentContact.firstName, to: updatedFirstName };
    if (currentContact.lastName !== updatedLastName) changes.lastName = { from: currentContact.lastName, to: updatedLastName };
    if (currentContact.email !== updatedEmail) changes.email = { from: currentContact.email, to: updatedEmail };
    if (currentContact.phone !== updatedPhone) changes.phone = { from: currentContact.phone, to: updatedPhone };
    if (currentContact.company !== updatedCompany) changes.company = { from: currentContact.company, to: updatedCompany };
    if (currentContact.jobTitle !== updatedJobTitle) changes.jobTitle = { from: currentContact.jobTitle, to: updatedJobTitle };
    if (currentContact.notes !== updatedNotes) changes.notes = { from: currentContact.notes, to: updatedNotes };
    if (currentContact.type !== updatedType) changes.type = { from: currentContact.type, to: updatedType };
    if (currentContact.organizationId !== updatedOrgId) changes.organizationId = { from: currentContact.organizationId, to: updatedOrgId };

    await logActivity("UPDATE", "Contact", id, `Updated contact: ${updatedFirstName} ${updatedLastName}`, changes, user.id);

    return NextResponse.json(contact);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, error } = await validateApiKey(req);
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const currentContact = await prisma.contact.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await logActivity("DELETE", "Contact", id, `Soft deleted contact`, null, user.id);

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
