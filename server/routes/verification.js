import express from 'express';
import { getDB } from '../db.js';
import { getSetting, generateVerificationCode, sendVerificationCode } from '../services/email.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.js';

const router = express.Router();

// Send verification code
router.post('/send-code', recaptchaMiddleware, async (req, res) => {
    const { email, type, userId } = req.body;

    if (!email || !type) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    if (!['register', 'email_change', 'password_reset'].includes(type)) {
        return res.status(400).json({ error: '无效的验证类型' });
    }

    try {
        const db = getDB();

        // Check email suffix whitelist for registration
        if (type === 'register') {
            const whitelist = await getSetting('email_suffix_whitelist');
            if (whitelist && whitelist.length > 0) {
                const emailSuffix = email.split('@')[1];
                if (!whitelist.some(suffix => emailSuffix.endsWith(suffix.trim()))) {
                    return res.status(400).json({ error: '该邮箱后缀不在白名单中' });
                }
            }

            // Check if email already registered
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ error: '该邮箱已被注册' });
            }
        }

        // Generate code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old codes for this email and type
        await db.query(
            'DELETE FROM email_verification_codes WHERE email = ? AND type = ?',
            [email, type]
        );

        // Insert new code
        await db.query(
            'INSERT INTO email_verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [userId || null, email, code, type, expiresAt]
        );

        // Send email
        await sendVerificationCode(email, code, type);

        res.json({ success: true, message: '验证码已发送' });
    } catch (err) {
        console.error('Send verification code error:', err);
        res.status(500).json({ error: err.message || '发送验证码失败' });
    }
});

// Verify code
router.post('/verify-code', async (req, res) => {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
        return res.status(400).json({ error: '缺少必要参数' });
    }

    try {
        const db = getDB();

        const [codes] = await db.query(
            'SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?',
            [email, code, type, new Date()]
        );

        if (codes.length === 0) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        // Mark as used
        await db.query('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [codes[0].id]);

        res.json({ success: true, message: '验证成功' });
    } catch (err) {
        console.error('Verify code error:', err);
        res.status(500).json({ error: err.message || '验证失败' });
    }
});

// Check if code is valid (without marking as used)
router.post('/check-code', async (req, res) => {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
        return res.status(400).json({ error: '缺少必要参数', valid: false });
    }

    try {
        const db = getDB();

        const [codes] = await db.query(
            'SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?',
            [email, code, type, new Date()]
        );

        res.json({ valid: codes.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message, valid: false });
    }
});

export default router;
