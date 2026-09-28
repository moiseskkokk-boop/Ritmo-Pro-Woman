import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import {
  createBodyAnalysis,
  createBodyAssessment,
  createSpecializationPlan,
  getActiveSpecializationPlan,
  getBodyAssessment,
  getBodyAnalyses,
  getBodyAssessments,
  getPersonalizationProfile,
  getWearableActivities,
  getWearableConnections,
  getWorkoutSessions,
  importWearableActivities,
  deleteUserAssessments,
  savePersonalizationProfile,
  upsertWearableConnection,
} from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const languageSchema = z.enum(["pt", "en", "es"]);
const viewSchema = z.enum(["front", "side", "back"]);
const dataUrlSchema = z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, "Envie uma imagem JPG, PNG ou WebP.").max(9_000_000);
const providerSchema = z.enum(["health_connect", "apple_health", "fitbit", "garmin", "other"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const analysisSchema = {
  type: "object",
  properties: {
    overview: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    estimatedAreas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          status: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["area", "status", "evidence"],
        additionalProperties: false,
      },
    },
    evolving: { type: "array", items: { type: "string" } },
    attention: { type: "array", items: { type: "string" } },
    priorities: { type: "array", items: { type: "string" } },
    day5: {
      type: "object",
      properties: {
        active: { type: "boolean" },
        focus: { type: "string" },
        reason: { type: "string" },
        session: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              sets: { type: "string" },
              reps: { type: "string" },
              cue: { type: "string" },
            },
            required: ["name", "sets", "reps", "cue"],
            additionalProperties: false,
          },
        },
      },
      required: ["active", "focus", "reason", "session"],
      additionalProperties: false,
    },
    dataBasis: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["overview", "confidence", "estimatedAreas", "evolving", "attention", "priorities", "day5", "dataBasis", "limitations"],
  additionalProperties: false,
} as const;

type AnalysisResult = {
  overview: string;
  confidence: number;
  estimatedAreas: Array<{ area: string; status: string; evidence: string }>;
  evolving: string[];
  attention: string[];
  priorities: string[];
  day5: { active: boolean; focus: string; reason: string; session: Array<{ name: string; sets: string; reps: string; cue: string }> };
  dataBasis: string[];
  limitations: string[];
};

function requireConsent(profile: Awaited<ReturnType<typeof getPersonalizationProfile>>) {
  if (!profile?.consentAt) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Confirme o aviso Antes de começar para liberar o acompanhamento personalizado." });
  }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function languageName(language: "pt" | "en" | "es") {
  return language === "en" ? "English" : language === "es" ? "Español" : "Português";
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function summarizeActivities(activities: Awaited<ReturnType<typeof getWearableActivities>>) {
  const averageHeartRates = activities.map(item => item.heartRateAvg).filter((value): value is number => value !== null);
  const maximumHeartRates = activities.map(item => item.heartRateMax).filter((value): value is number => value !== null);
  return {
    activities: activities.length,
    caloriesKcal: activities.reduce((sum, item) => sum + (item.caloriesKcal ?? 0), 0) || null,
    durationMinutes: activities.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0) || null,
    cardioMinutes: activities.filter(item => /cardio|run|corrida|caminh|bike|cicl|ellipt|natação|swim/i.test(item.activityType ?? "")).reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0) || null,
    heartRateAvg: averageHeartRates.length ? Math.round(averageHeartRates.reduce((sum, value) => sum + value, 0) / averageHeartRates.length) : null,
    heartRateMax: maximumHeartRates.length ? Math.max(...maximumHeartRates) : null,
    steps: activities.reduce((sum, item) => sum + (item.steps ?? 0), 0) || null,
    distanceMeters: activities.reduce((sum, item) => sum + (item.distanceMeters ?? 0), 0) || null,
  };
}

export function calculateConfidence(input: { hasPrevious: boolean; hasHeight: boolean; hasWeight: boolean; hasMeasurements: boolean; hasNotes: boolean; quality: Array<{ width: number; height: number; bytes: number; aspect: number; consistency: { lighting: boolean; distance: boolean; posture: boolean; clothing: boolean; environment: boolean } }> }) {
  const usable = input.quality.filter(photo => photo.width >= 720 && photo.height >= 720 && photo.bytes >= 80_000);
  const qualityScore = usable.length * 8;
  const aspects = input.quality.map(photo => photo.aspect);
  const consistent = aspects.length === 3 && Math.max(...aspects) - Math.min(...aspects) < 0.12;
  const consistency = input.quality.length === 3 ? Object.values(input.quality[0].consistency).filter(Boolean).length : 0;
  const score = 24 + qualityScore + consistency * 3 + (consistent ? 10 : 0) + (input.hasPrevious ? 14 : 0) + (input.hasHeight ? 4 : 0) + (input.hasWeight ? 8 : 0) + (input.hasMeasurements ? 12 : 0) + (input.hasNotes ? 6 : 0);
  return Math.min(94, score);
}

async function serializeAssessment(assessment: NonNullable<Awaited<ReturnType<typeof getBodyAssessment>>>) {
  const [frontUrl, sideUrl, backUrl] = await Promise.all([
    storageGetSignedUrl(assessment.frontKey),
    storageGetSignedUrl(assessment.sideKey),
    storageGetSignedUrl(assessment.backKey),
  ]);
  return {
    id: assessment.id,
    label: assessment.label,
    assessmentDate: assessment.assessmentDate,
    frontUrl,
    sideUrl,
    backUrl,
    heightCm: assessment.heightCm,
    weightKg: assessment.weightKg,
    measurements: parseJson<Record<string, string>>(assessment.measurementsJson, {}),
    trainingNotes: assessment.trainingNotes,
    quality: parseJson(assessment.qualityJson, []),
    trainingData: parseJson(assessment.trainingDataJson, {}),
    createdAt: assessment.createdAt,
  };
}

function contentToString(content: string | Array<{ type: string; text?: string }>) {
  return typeof content === "string" ? content : content.map(part => part.text ?? "").join("\n");
}

export const personalizationRouter = router({
  profile: protectedProcedure.query(({ ctx }) => getPersonalizationProfile(ctx.user.id)),
  deleteAssessments: protectedProcedure.mutation(({ ctx }) => deleteUserAssessments(ctx.user.id)),
  wearableConnections: protectedProcedure.query(({ ctx }) => getWearableConnections(ctx.user.id)),
  connectWearable: protectedProcedure.input(z.object({ provider: providerSchema })).mutation(({ ctx, input }) => upsertWearableConnection(ctx.user.id, input.provider, "connected")),
  syncWearable: protectedProcedure
    .input(z.object({ activities: z.array(z.object({ provider: providerSchema, externalId: z.string().min(1).max(255), activityDate: dateSchema, startedAt: z.string().datetime().nullable().optional(), activityType: z.string().max(128).nullable().optional(), durationMinutes: z.number().int().nonnegative().nullable().optional(), caloriesKcal: z.number().int().nonnegative().nullable().optional(), heartRateAvg: z.number().int().nonnegative().nullable().optional(), heartRateMax: z.number().int().nonnegative().nullable().optional(), steps: z.number().int().nonnegative().nullable().optional(), distanceMeters: z.number().int().nonnegative().nullable().optional(), rawMetrics: z.record(z.string(), z.unknown()).optional() })).max(500) }))
    .mutation(({ ctx, input }) => importWearableActivities(ctx.user.id, input.activities)),
  wearableHistory: protectedProcedure.input(z.object({ startDate: dateSchema, endDate: dateSchema })).query(({ ctx, input }) => getWearableActivities(ctx.user.id, input.startDate, input.endDate)),
  weeklyActivity: protectedProcedure.input(z.object({ weekKey: dateSchema })).query(async ({ ctx, input }) => {
    const endDate = addDays(input.weekKey, 6);
    const [activities, sessions] = await Promise.all([
      getWearableActivities(ctx.user.id, input.weekKey, endDate),
      getWorkoutSessions(ctx.user.id, input.weekKey, endDate),
    ]);
    return {
      weekKey: input.weekKey,
      endDate,
      completedWorkouts: sessions.length,
      summary: summarizeActivities(activities),
      daily: Array.from({ length: 7 }, (_, index) => {
        const date = addDays(input.weekKey, index);
        const dayActivities = activities.filter(item => item.activityDate === date);
        return { date, activities: dayActivities, summary: summarizeActivities(dayActivities) };
      }),
    };
  }),
  saveProfile: protectedProcedure
    .input(z.object({
      language: languageSchema.optional(),
      consent: z.boolean().optional(),
      goal: z.string().max(255).nullable().optional(),
      healthNotes: z.string().max(4000).nullable().optional(),
      heightCm: z.string().max(32).nullable().optional(),
      weightKg: z.string().max(32).nullable().optional(),
      measurements: z.record(z.string(), z.string().max(32)).nullable().optional(),
    }))
    .mutation(({ ctx, input }) => savePersonalizationProfile(ctx.user.id, {
      ...input,
      measurementsJson: input.measurements === undefined ? undefined : JSON.stringify(input.measurements),
    })),
  uploadPhoto: protectedProcedure
    .input(z.object({ view: viewSchema, dataUrl: dataUrlSchema }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getPersonalizationProfile(ctx.user.id);
      requireConsent(profile);
      const match = input.dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de foto inválido." });
      const contentType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > 6_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "A foto precisa ter no máximo 6 MB." });
      const upload = await storagePut(`private/body/${ctx.user.id}/${Date.now()}-${input.view}.${contentType.split("/")[1]}`, buffer, contentType);
      return { view: input.view, key: upload.key };
    }),
  assessments: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getPersonalizationProfile(ctx.user.id);
    requireConsent(profile);
    const rows = await getBodyAssessments(ctx.user.id);
    return Promise.all(rows.map(serializeAssessment));
  }),
  createAssessment: protectedProcedure
    .input(z.object({
      label: z.string().min(1).max(64),
      assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weekKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      frontKey: z.string().min(1).max(255),
      sideKey: z.string().min(1).max(255),
      backKey: z.string().min(1).max(255),
      heightCm: z.string().max(32).nullable().optional(),
      weightKg: z.string().max(32).nullable().optional(),
      measurements: z.record(z.string(), z.string().max(32)).nullable().optional(),
      trainingNotes: z.string().max(4000).nullable().optional(),
      quality: z.array(z.object({ view: viewSchema, width: z.number().int().positive(), height: z.number().int().positive(), bytes: z.number().int().positive(), aspect: z.number().positive(), consistency: z.object({ lighting: z.boolean(), distance: z.boolean(), posture: z.boolean(), clothing: z.boolean(), environment: z.boolean() }) })).length(3),
      trainingData: z.record(z.string(), z.string().max(500)).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getPersonalizationProfile(ctx.user.id);
      requireConsent(profile);
      const assessment = await createBodyAssessment(ctx.user.id, {
        ...input,
        measurementsJson: input.measurements ? JSON.stringify(input.measurements) : null,
        qualityJson: JSON.stringify(input.quality),
        trainingDataJson: JSON.stringify(input.trainingData),
      });
      if (!assessment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a avaliação." });
      return serializeAssessment(assessment);
    }),
  latestAnalysis: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getPersonalizationProfile(ctx.user.id);
    requireConsent(profile);
    const analyses = await getBodyAnalyses(ctx.user.id);
    const latest = analyses[0];
    return latest ? { ...latest, result: parseJson(latest.resultJson, null) } : null;
  }),
  activeDay5: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getPersonalizationProfile(ctx.user.id);
    requireConsent(profile);
    const plan = await getActiveSpecializationPlan(ctx.user.id);
    return plan ? { ...plan, session: parseJson(plan.sessionJson, []) } : null;
  }),
  analyze: protectedProcedure
    .input(z.object({ assessmentId: z.number().int().positive(), language: languageSchema }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getPersonalizationProfile(ctx.user.id);
      requireConsent(profile);
      const assessment = await getBodyAssessment(ctx.user.id, input.assessmentId);
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada." });
      const allAssessments = await getBodyAssessments(ctx.user.id);
      const previous = allAssessments.filter(item => item.id !== assessment.id).slice(0, 3);
      const height = assessment.heightCm ?? profile?.heightCm;
      const weight = assessment.weightKg ?? profile?.weightKg;
      const measurements = parseJson<Record<string, string>>(assessment.measurementsJson ?? profile?.measurementsJson, {});
      const trainingNotes = assessment.trainingNotes ?? profile?.healthNotes ?? "";
      const quality = parseJson<Array<{ view: string; width: number; height: number; bytes: number; aspect: number; consistency: { lighting: boolean; distance: boolean; posture: boolean; clothing: boolean; environment: boolean } }>>(assessment.qualityJson, []);
      const trainingData = parseJson<Record<string, string>>(assessment.trainingDataJson, {});
      const activityWeekKey = assessment.weekKey ?? assessment.assessmentDate;
      const activityEndDate = addDays(activityWeekKey, 6);
      const [wearableWeek, workoutWeek] = await Promise.all([
        getWearableActivities(ctx.user.id, activityWeekKey, activityEndDate),
        getWorkoutSessions(ctx.user.id, activityWeekKey, activityEndDate),
      ]);
      const wearableSummary = summarizeActivities(wearableWeek);
      const confidence = calculateConfidence({
        hasPrevious: previous.length > 0,
        hasHeight: Boolean(height),
        hasWeight: Boolean(weight),
        hasMeasurements: Object.keys(measurements).length > 0,
        hasNotes: Boolean(trainingNotes),
        quality,
      });
      const [frontUrl, sideUrl, backUrl] = await Promise.all([
        storageGetSignedUrl(assessment.frontKey),
        storageGetSignedUrl(assessment.sideKey),
        storageGetSignedUrl(assessment.backKey),
      ]);
      const previousImages = previous[0]
        ? await Promise.all([
            storageGetSignedUrl(previous[0].frontKey),
            storageGetSignedUrl(previous[0].sideKey),
            storageGetSignedUrl(previous[0].backKey),
          ])
        : [];
      const previousContext = previous.map(item => ({ label: item.label, date: item.assessmentDate, weightKg: item.weightKg, measurements: parseJson(item.measurementsJson, {}) }));
      const languageLabel = languageName(input.language);
      const response = await invokeLLM({
        userId: ctx.user.id,
        feature: "body_analysis",
        model: "gemini-3-flash-preview",
        maxTokens: 5000,
        messages: [
          {
            role: "system",
            content: `Você é uma assistente de acompanhamento de treino. Responda somente no idioma ${languageLabel}. Analise fotos apenas como estimativa visual, nunca como diagnóstico, medição clínica ou certeza. Não avalie saúde, lesões, alergias ou capacidade médica. Não compare a pessoa a padrões genéricos; compare apenas com avaliações anteriores da própria pessoa quando existirem. Analise conjuntamente objetivo, carga dos membros superiores, carga do agachamento, cardio diário, horas de sono, recuperação e fadiga após os quatro dias. Use os dados diários do dispositivo somente quando estiverem presentes; nunca invente métricas e indique dados ausentes como indisponíveis. O programa tem quatro dias principais intactos; o Dia 5 é opcional, complementar, temporário e pode ser recuperação ativa, cardio/condicionamento, core/estabilidade, mobilidade, treino complementar, estímulo adicional ou descanso. Considere o cardio já realizado antes de sugerir cardio no Dia 5. Se as sete respostas semanais não estiverem completas, active deve be false e explique que faltam dados. A confiança numérica final será calculada pelo sistema; não invente precisão.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: JSON.stringify({
                task: "Produza a avaliação corporal transparente com áreas, prioridades e decisão conservadora sobre Dia 5.",
                current: { label: assessment.label, date: assessment.assessmentDate, weekKey: assessment.weekKey, heightCm: height ?? null, weightKg: weight ?? null, measurements, trainingNotes },
                previous: previousContext,
                knownTrainingData: { baseProgram: "4 dias existentes permanecem intactos", setsAndReps: "prescrição do treino base atual", ...trainingData, weeklyFrequency: "4 dias base" },
                wearableActivity: { weekKey: activityWeekKey, dailyRecords: wearableWeek, summary: wearableSummary, dataAvailable: wearableWeek.length > 0, unavailableMessage: wearableWeek.length ? null : "Dados não disponíveis para este dispositivo." },
                completedWorkoutDays: workoutWeek.map(session => session.sessionDate),
                requiredConfidence: confidence,
              }) },
              { type: "image_url", image_url: { url: frontUrl, detail: "auto" } },
              { type: "image_url", image_url: { url: sideUrl, detail: "auto" } },
              { type: "image_url", image_url: { url: backUrl, detail: "auto" } },
              ...(previousImages.length > 0
                ? [
                    { type: "text" as const, text: `As próximas três imagens são da avaliação anterior (${previous[0].label}) e devem ser usadas somente para comparação com a própria cliente.` },
                    ...previousImages.map(url => ({ type: "image_url" as const, image_url: { url, detail: "auto" as const } })),
                  ]
                : []),
            ],
          },
        ],
        responseFormat: { type: "json_schema", json_schema: { name: "body_analysis", strict: true, schema: analysisSchema } },
      });
      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "A análise não retornou dados." });
      let result: AnalysisResult;
      try {
        result = JSON.parse(contentToString(raw)) as AnalysisResult;
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "A análise retornou um formato inválido." });
      }
      result.confidence = confidence;
      const hasWeeklyContext = Object.keys(trainingData).length === 7 && Object.values(trainingData).every(value => Boolean(value));
      result.day5.active = Boolean(result.day5.active && hasWeeklyContext);
      if (!hasWeeklyContext) result.day5.reason = "As sete respostas da avaliação semanal precisam estar completas antes de definir uma quinta sessão com segurança.";
      const savedAnalysis = await createBodyAnalysis(ctx.user.id, {
        assessmentId: assessment.id,
        language: input.language,
        confidence,
        resultJson: JSON.stringify(result),
      });
      if (!savedAnalysis) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar a análise." });
      const savedPlan = await createSpecializationPlan(ctx.user.id, {
        analysisId: savedAnalysis.id,
        active: Boolean(result.day5.active),
        focus: result.day5.focus || "Sem especialização",
        rationale: result.day5.reason,
        confidence,
        sessionJson: JSON.stringify(result.day5.session ?? []),
      });
      return { analysis: { ...savedAnalysis, result }, day5: savedPlan ? { ...savedPlan, session: result.day5.session ?? [] } : null };
    }),
});
