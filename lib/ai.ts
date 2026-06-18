// Lazy-initialize the model using dynamic import so @ai-sdk/google
// is never loaded during Next.js build-time page data collection.
// The package checks GOOGLE_GENERATIVE_AI_API_KEY at import time.

let _model: any = null;

export async function getGoogleModel() {
  if (!_model) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined');
    }
    const { google } = await import('@ai-sdk/google');
    _model = google('gemini-3.1-flash-lite');
  }
  return _model;
}
