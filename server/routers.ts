import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { authenticateLocalUser, createAuthSession, deleteAllUserData, deleteAuthSession, getCompletedExerciseIds, getUserBySessionToken, getUserProfilePhoto, getWorkoutSessions, registerLocalUser, setExerciseCompletion, setUserProfilePhoto, setWorkoutSession } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { decodeProfilePhotoDataUrl } from "./profilePhoto";
import { personalizationRouter } from "./routers/personalization";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().email().max(320),
      password: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await registerLocalUser(input.name, input.email, input.password);
      if (!user) throw new Error("Registration failed");
      const session = await createAuthSession(user.id);
      ctx.res.cookie(COOKIE_NAME, session.token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return user;
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email().max(320),
      password: z.string().min(1).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await authenticateLocalUser(input.email, input.password);
      if (!user) throw new Error("INVALID_CREDENTIALS");
      const session = await createAuthSession(user.id);
      ctx.res.cookie(COOKIE_NAME, session.token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return user;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const token = (ctx.req.headers.cookie ?? "").split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
      if (token) await deleteAuthSession(token);
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workout: router({
    completed: protectedProcedure.query(({ ctx }) => getCompletedExerciseIds(ctx.user.id)),
    sessions: protectedProcedure
      .input(z.object({ startDate: z.string().min(10).max(10), endDate: z.string().min(10).max(10) }))
      .query(({ ctx, input }) => getWorkoutSessions(ctx.user.id, input.startDate, input.endDate)),
    setCompleted: protectedProcedure
      .input(z.object({ exerciseId: z.string().min(1).max(128), completed: z.boolean() }))
      .mutation(({ ctx, input }) => setExerciseCompletion(ctx.user.id, input.exerciseId, input.completed)),
    setSession: protectedProcedure
      .input(z.object({ sessionDate: z.string().min(10).max(10), workoutId: z.string().min(1).max(32), completed: z.boolean() }))
      .mutation(({ ctx, input }) => {
        const todayInPortugal = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        if (input.sessionDate !== todayInPortugal) throw new Error("Only the current calendar day can be registered.");
        return setWorkoutSession(ctx.user.id, input.sessionDate, input.workoutId, input.completed);
      }),
  }),
  account: router({
    deleteAllData: protectedProcedure.mutation(({ ctx }) => deleteAllUserData(ctx.user.id)),
    profilePhoto: protectedProcedure.query(async ({ ctx }) => {
      const key = await getUserProfilePhoto(ctx.user.id);
      return key ? { key, url: await storageGetSignedUrl(key) } : null;
    }),
    uploadProfilePhoto: protectedProcedure
      .input(z.object({ dataUrl: z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, "Envie uma imagem JPG, PNG ou WebP.").max(9_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const decoded = decodeProfilePhotoDataUrl(input.dataUrl);
        if (!decoded) throw new Error("Escolha uma imagem JPG, PNG ou WebP válida de até 6 MB.");
        const upload = await storagePut(`private/profile/${ctx.user.id}/avatar.${decoded.extension}`, decoded.buffer, decoded.contentType);
        await setUserProfilePhoto(ctx.user.id, upload.key);
        return { key: upload.key, url: await storageGetSignedUrl(upload.key) };
      }),
    deleteProfilePhoto: protectedProcedure.mutation(({ ctx }) => setUserProfilePhoto(ctx.user.id, null)),
  }),
  personalization: personalizationRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;

