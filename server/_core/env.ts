export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  geminiDailyTokenLimit: Number(process.env.GEMINI_DAILY_TOKEN_LIMIT ?? "100000"),
  geminiUserDailyTokenLimit: Number(process.env.GEMINI_USER_DAILY_TOKEN_LIMIT ?? "20000"),
  geminiMaxInputTokens: Number(process.env.GEMINI_MAX_INPUT_TOKENS ?? "12000"),
  geminiMaxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "5000"),
  isProduction: process.env.NODE_ENV === "production",
};
