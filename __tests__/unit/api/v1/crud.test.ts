import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";
import { logActivity } from "@/app/actions/activity-logs";

// Mock API Authentication and Activity Logging
jest.mock("@/lib/api-auth", () => ({
  validateApiKey: jest.fn(),
}));

jest.mock("@/app/actions/activity-logs", () => ({
  logActivity: jest.fn(),
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    location: {
      findUnique: jest.fn(),
    },
    contact: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    event: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    project: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    socialPost: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    task: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Import Route Handlers
import * as contactsRoute from "@/app/api/v1/contacts/route";
import * as contactsIdRoute from "@/app/api/v1/contacts/[id]/route";
import * as eventsRoute from "@/app/api/v1/events/route";
import * as eventsIdRoute from "@/app/api/v1/events/[id]/route";
import * as organizationsRoute from "@/app/api/v1/organizations/route";
import * as organizationsIdRoute from "@/app/api/v1/organizations/[id]/route";
import * as projectsIdRoute from "@/app/api/v1/projects/[id]/route";
import * as socialRoute from "@/app/api/v1/social/route";
import * as socialIdRoute from "@/app/api/v1/social/[id]/route";
import * as tasksRoute from "@/app/api/v1/tasks/route";
import * as tasksIdRoute from "@/app/api/v1/tasks/[id]/route";

describe("REST API write endpoints", () => {
  const mockUser = { id: "user-123", username: "testapi" };

  beforeEach(() => {
    jest.clearAllMocks();
    (validateApiKey as jest.Mock).mockResolvedValue({ user: mockUser, error: null });
  });

  describe("Contacts API", () => {
    it("POST /api/v1/contacts should create a new contact and log activity", async () => {
      const mockContact = { id: "c-1", firstName: "Jane", lastName: "Doe", type: "Internal" };
      (prisma.contact.create as jest.Mock).mockResolvedValue(mockContact);

      const req = {
        json: jest.fn().mockResolvedValue({
          firstName: "Jane",
          lastName: "Doe",
          type: "Internal",
          email: "jane.doe@example.com",
        }),
      } as unknown as NextRequest;

      const res = await contactsRoute.POST(req);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(mockContact);
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: "Jane",
          lastName: "Doe",
          type: "Internal",
          createdById: mockUser.id,
        }),
      });
      expect(logActivity).toHaveBeenCalledWith(
        "CREATE",
        "Contact",
        "c-1",
        "Created contact: Jane Doe",
        null,
        mockUser.id
      );
    });

    it("PUT /api/v1/contacts/[id] should update contact and log diff", async () => {
      const mockExisting = { id: "c-1", firstName: "Jane", lastName: "Doe", type: "Internal" };
      (prisma.contact.findFirst as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.contact.update as jest.Mock).mockResolvedValue({ ...mockExisting, lastName: "Smith" });

      const req = {
        json: jest.fn().mockResolvedValue({ lastName: "Smith" }),
      } as unknown as NextRequest;

      const res = await contactsIdRoute.PUT(req, { params: { id: "c-1" } });
      expect(res.status).toBe(200);
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: "c-1" },
        data: expect.objectContaining({
          lastName: "Smith",
          updatedById: mockUser.id,
        }),
      });
      expect(logActivity).toHaveBeenCalledWith(
        "UPDATE",
        "Contact",
        "c-1",
        "Updated contact: Jane Smith",
        expect.any(Object),
        mockUser.id
      );
    });

    it("DELETE /api/v1/contacts/[id] should soft delete contact", async () => {
      const mockExisting = { id: "c-1", firstName: "Jane", lastName: "Doe", type: "Internal" };
      (prisma.contact.findFirst as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.contact.update as jest.Mock).mockResolvedValue(mockExisting);

      const req = {} as NextRequest;
      const res = await contactsIdRoute.DELETE(req, { params: { id: "c-1" } });
      expect(res.status).toBe(200);
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: "c-1" },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedById: mockUser.id,
        }),
      });
      expect(logActivity).toHaveBeenCalledWith(
        "DELETE",
        "Contact",
        "c-1",
        "Soft deleted contact",
        null,
        mockUser.id
      );
    });
  });

  describe("Events API", () => {
    it("POST /api/v1/events should create a new event", async () => {
      const mockEvent = { id: "e-1", title: "Launch Fair", locationId: "loc-1" };
      (prisma.location.findUnique as jest.Mock).mockResolvedValue({ id: "loc-1", name: "Main Lawn" });
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const req = {
        json: jest.fn().mockResolvedValue({
          title: "Launch Fair",
          startTime: "2026-10-01T17:00:00Z",
          endTime: "2026-10-01T20:00:00Z",
          locationId: "loc-1",
        }),
      } as unknown as NextRequest;

      const res = await eventsRoute.POST(req);
      expect(res.status).toBe(201);
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Launch Fair",
          locationId: "loc-1",
          createdById: mockUser.id,
        }),
      });
      expect(logActivity).toHaveBeenCalledWith(
        "CREATE",
        "Event",
        "e-1",
        "Created event: Launch Fair",
        null,
        mockUser.id
      );
    });
  });

  describe("Organizations API", () => {
    it("POST /api/v1/organizations should create organization", async () => {
      const mockOrg = { id: "org-1", name: "Eco Collective", category: "Vendor" };
      (prisma.organization.create as jest.Mock).mockResolvedValue(mockOrg);

      const req = {
        json: jest.fn().mockResolvedValue({
          name: "Eco Collective",
          category: "Vendor",
        }),
      } as unknown as NextRequest;

      const res = await organizationsRoute.POST(req);
      expect(res.status).toBe(201);
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Eco Collective",
          category: "Vendor",
          createdById: mockUser.id,
        }),
      });
    });
  });

  describe("Projects API", () => {
    it("PUT /api/v1/projects/[id] should update project status", async () => {
      const mockProj = { id: "p-1", name: "PWA Optimization", status: "Active" };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProj);
      (prisma.project.update as jest.Mock).mockResolvedValue({ ...mockProj, status: "Completed" });

      const req = {
        json: jest.fn().mockResolvedValue({ status: "Completed" }),
      } as unknown as NextRequest;

      const res = await projectsIdRoute.PUT(req, { params: { id: "p-1" } });
      expect(res.status).toBe(200);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: expect.objectContaining({
          status: "Completed",
          updatedById: mockUser.id,
        }),
      });
    });
  });

  describe("Social Posts API", () => {
    it("POST /api/v1/social should create drafted post", async () => {
      const mockPost = { id: "sp-1", content: "Check this out!", platform: "Twitter" };
      (prisma.socialPost.create as jest.Mock).mockResolvedValue(mockPost);

      const req = {
        json: jest.fn().mockResolvedValue({
          content: "Check this out!",
          platform: "Twitter",
        }),
      } as unknown as NextRequest;

      const res = await socialRoute.POST(req);
      expect(res.status).toBe(201);
      expect(prisma.socialPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: "Check this out!",
          platform: "Twitter",
        }),
      });
    });
  });

  describe("Tasks API", () => {
    it("POST /api/v1/tasks should create Kanban task", async () => {
      const mockTask = { id: "t-1", title: "Write REST tests" };
      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const req = {
        json: jest.fn().mockResolvedValue({
          title: "Write REST tests",
        }),
      } as unknown as NextRequest;

      const res = await tasksRoute.POST(req);
      expect(res.status).toBe(201);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Write REST tests",
          createdById: mockUser.id,
        }),
      });
    });
  });
});
