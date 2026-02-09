import { describe, it, expect, vi, beforeEach } from "vitest";
import { callsRouter } from "./calls";
import * as db from "../db";

// Mock the database functions
vi.mock("../db", () => ({
  getAllCalls: vi.fn(),
  createCall: vi.fn(),
  updateCallRecord: vi.fn(),
  deleteCallRecord: vi.fn(),
}));

describe("callsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return all calls sorted by newest first", async () => {
      const mockCalls = [
        {
          id: 1,
          patientName: "John Doe",
          appointmentTime: "10:00 AM",
          agentName: "Agent 1",
          status: "confirmed" as const,
          comment: "Test",
          createdAt: new Date("2026-02-09T08:00:00Z"),
          updatedAt: new Date("2026-02-09T08:00:00Z"),
        },
        {
          id: 2,
          patientName: "Jane Smith",
          appointmentTime: "11:00 AM",
          agentName: "Agent 2",
          status: "no_answer" as const,
          comment: null,
          createdAt: new Date("2026-02-09T09:00:00Z"),
          updatedAt: new Date("2026-02-09T09:00:00Z"),
        },
      ];

      vi.mocked(db.getAllCalls).mockResolvedValue(mockCalls);

      const caller = callsRouter.createCaller({});
      const result = await caller.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(2); // Newest first
      expect(result[1]?.id).toBe(1);
    });

    it("should return empty array when no calls exist", async () => {
      vi.mocked(db.getAllCalls).mockResolvedValue([]);

      const caller = callsRouter.createCaller({});
      const result = await caller.list();

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a new call with no_answer status", async () => {
      vi.mocked(db.createCall).mockResolvedValue({ insertId: 1 } as any);

      const caller = callsRouter.createCaller({});
      const result = await caller.create({
        patientName: "John Doe",
        appointmentTime: "10:00 AM",
        agentName: "Agent 1",
        comment: "Test comment",
      });

      expect(result.success).toBe(true);
      expect(db.createCall).toHaveBeenCalledWith({
        patientName: "John Doe",
        appointmentTime: "10:00 AM",
        agentName: "Agent 1",
        status: "no_answer",
        comment: "Test comment",
      });
    });

    it("should fail with invalid input", async () => {
      const caller = callsRouter.createCaller({});

      try {
        await caller.create({
          patientName: "",
          appointmentTime: "10:00 AM",
          agentName: "Agent 1",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("update", () => {
    it("should update a call", async () => {
      vi.mocked(db.updateCallRecord).mockResolvedValue({} as any);

      const caller = callsRouter.createCaller({});
      const result = await caller.update({
        id: 1,
        status: "confirmed",
        comment: "Updated comment",
      });

      expect(result.success).toBe(true);
      expect(db.updateCallRecord).toHaveBeenCalledWith(1, {
        status: "confirmed",
        comment: "Updated comment",
      });
    });
  });

  describe("delete", () => {
    it("should delete a call", async () => {
      vi.mocked(db.deleteCallRecord).mockResolvedValue({} as any);

      const caller = callsRouter.createCaller({});
      const result = await caller.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(db.deleteCallRecord).toHaveBeenCalledWith(1);
    });
  });

  describe("export", () => {
    it("should export calls as CSV", async () => {
      const mockCalls = [
        {
          id: 1,
          patientName: "John Doe",
          appointmentTime: "10:00 AM",
          agentName: "Agent 1",
          status: "confirmed" as const,
          comment: "Test",
          createdAt: new Date("2026-02-09T08:00:00Z"),
          updatedAt: new Date("2026-02-09T08:00:00Z"),
        },
      ];

      vi.mocked(db.getAllCalls).mockResolvedValue(mockCalls);

      const caller = callsRouter.createCaller({});
      const result = await caller.export();

      expect(result.success).toBe(true);
      expect(result.csv).toContain("ID,Patient Name");
      expect(result.csv).toContain("John Doe");
      expect(result.fileName).toMatch(/pura_calls_\d{4}-\d{2}-\d{2}\.csv/);
    });
  });
});
