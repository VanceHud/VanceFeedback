import app, { initializeApp } from './app.js';

const PORT = process.env.PORT || 3000;

// Start server after database initialization
(async () => {
    await initializeApp();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();
