import { getDB } from '../db.js';

/**
 * Custom Store for express-rate-limit using the application's database
 * Supports MySQL and SQLite via getDB() abstraction
 */
class DatabaseStore {
    constructor() {
        this.windowMs = 0; // Will be set by express-rate-limit init
    }

    init(options) {
        this.windowMs = options.windowMs;
    }

    async increment(key) {
        try {
            const db = getDB();
            const now = Date.now();
            const expirationTime = now + this.windowMs;

            // Try to update existing record
            // MySQL/SQLite syntax difference for UPSERT is handled by try/catch or logic
            // Since we have an abstraction layer, we'll try to get first

            // 1. Get current limit
            const [rows] = await db.query('SELECT hit_count, reset_time FROM rate_limits WHERE key_id = ?', [key]);

            let currentHits = 0;
            let resetTime = expirationTime;

            if (rows && rows.length > 0) {
                const record = rows[0];
                if (record.reset_time <= now) {
                    // Expired, reset
                    currentHits = 1;
                    resetTime = expirationTime;
                    await db.query('UPDATE rate_limits SET hit_count = ?, reset_time = ? WHERE key_id = ?', [currentHits, resetTime, key]);
                } else {
                    // Not expired, increment
                    currentHits = record.hit_count + 1;
                    resetTime = record.reset_time;
                    await db.query('UPDATE rate_limits SET hit_count = ? WHERE key_id = ?', [currentHits, key]);
                }
            } else {
                // New record
                currentHits = 1;
                await db.query('INSERT INTO rate_limits (key_id, hit_count, reset_time) VALUES (?, ?, ?)', [key, currentHits, resetTime]);
            }

            return {
                totalHits: currentHits,
                resetTime: new Date(resetTime),
            };
        } catch (err) {
            console.error('Rate Limit Store Error (increment):', err);
            // Fallback to allow request if store fails
            return {
                totalHits: 0,
                resetTime: new Date(Date.now() + this.windowMs),
            };
        }
    }

    async decrement(key) {
        try {
            const db = getDB();
            await db.query('UPDATE rate_limits SET hit_count = hit_count - 1 WHERE key_id = ? AND hit_count > 0', [key]);
        } catch (err) {
            console.error('Rate Limit Store Error (decrement):', err);
        }
    }

    async resetKey(key) {
        try {
            const db = getDB();
            await db.query('DELETE FROM rate_limits WHERE key_id = ?', [key]);
        } catch (err) {
            console.error('Rate Limit Store Error (resetKey):', err);
        }
    }
}

export default DatabaseStore;
