import { google } from '@ai-sdk/google';

// Lazy-initialize the model so the env var check only runs at runtime,
// not during Next.js build-time page data collection.
let _model: ReturnType<typeof google> | null = null;

export function getGoogleModel() {
  if (!_model) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined');
    }
    _model = google('gemini-3.1-flash-lite');
  }
  return _model;
}

// Keep backward-compatible export (lazy via getter)
export const googleModel = new Proxy({} as ReturnType<typeof google>, {
  get(_, prop) {
    return (getGoogleModel() as any)[prop];
  },
});
