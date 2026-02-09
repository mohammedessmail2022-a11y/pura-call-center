import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getAllCalls, createCall, updateCallRecord, deleteCallRecord } from "../db";
import { TRPCError } from "@trpc/server";

export const callsRouter = router({
  /**
   * Get all calls (public - all agents can see all calls)
   */
  list: publicProcedure.query(async () => {
    try {
      const allCalls = await getAllCalls();
      // Sort by newest first
      return allCalls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Failed to fetch calls:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch calls",
      });
    }
  }),

  /**
   * Create a new call
   */
  create: publicProcedure
    .input(
      z.object({
        patientName: z.string().min(1, "Patient name is required"),
        appointmentTime: z.string().min(1, "Appointment time is required"),
        agentName: z.string().min(1, "Agent name is required"),
        comment: z.string().optional().default(""),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await createCall({
          patientName: input.patientName,
          appointmentTime: input.appointmentTime,
          agentName: input.agentName,
          status: "no_answer",
          comment: input.comment,
        });
        return { success: true, message: "Call created successfully" };
      } catch (error) {
        console.error("Failed to create call:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create call",
        });
      }
    }),

  /**
   * Update a call
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        patientName: z.string().optional(),
        appointmentTime: z.string().optional(),
        agentName: z.string().optional(),
        status: z.enum(["no_answer", "confirmed", "redirected"]).optional(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        await updateCallRecord(id, updateData);
        return { success: true, message: "Call updated successfully" };
      } catch (error) {
        console.error("Failed to update call:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update call",
        });
      }
    }),

  /**
   * Delete a call (admin only)
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteCallRecord(input.id);
        return { success: true, message: "Call deleted successfully" };
      } catch (error) {
        console.error("Failed to delete call:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete call",
        });
      }
    }),

  /**
   * Export all calls as CSV
   */
  export: publicProcedure.query(async () => {
    try {
      const allCalls = await getAllCalls();
      
      // Generate CSV content
      const headers = ["ID", "Patient Name", "Appointment Time", "Agent Name", "Status", "Comment", "Created At"];
      const rows = allCalls.map((call) => [
        call.id.toString(),
        `"${call.patientName}"`,
        `"${call.appointmentTime}"`,
        `"${call.agentName}"`,
        call.status,
        `"${(call.comment || "").replace(/"/g, '""')}"`,
        new Date(call.createdAt).toISOString(),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      return {
        success: true,
        csv: csvContent,
        fileName: `pura_calls_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } catch (error) {
      console.error("Failed to export calls:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export calls",
      });
    }
  }),
});
