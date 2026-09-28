import { z } from "zod";
import { getNotificationPreferences, saveNotificationPreferences } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const days = z.array(z.string().regex(/^[0-6]$/)).min(1).max(7);

export const notificationsRouter = router({
  preferences: protectedProcedure.query(({ ctx }) => getNotificationPreferences(ctx.user.id)),
  save: protectedProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      browserEnabled: z.boolean().optional(),
      dailyReminder: z.boolean().optional(),
      reminderTime: time.optional(),
      reminderDays: days.optional(),
      weeklySummary: z.boolean().optional(),
      weeklyDay: z.string().regex(/^[0-6]$/).optional(),
      weeklyTime: time.optional(),
      monthlyCheckIn: z.boolean().optional(),
      quietStart: time.optional(),
      quietEnd: time.optional(),
      customMessage: z.string().max(180).nullable().optional(),
    }))
    .mutation(({ ctx, input }) => saveNotificationPreferences(ctx.user.id, {
      ...input,
      reminderDaysJson: input.reminderDays ? JSON.stringify(input.reminderDays) : undefined,
    })),
});
