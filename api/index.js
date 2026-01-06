import app, { initializeApp } from '../server/app.js';

// Vercel serverless function handler
// Initialization is handled idempotently by initializeApp()
export default async (req, res) => {
    // Initialize on first request (cold start) - safe to call multiple times
    await initializeApp();

    // Pass request to Express app
    return app(req, res);
};
