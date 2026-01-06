import { getSetting } from '../services/email.js';
import * as altcha from 'altcha-lib';

// Verify Cloudflare Turnstile token
export const verifyTurnstile = async (token) => {
    try {
        const secretKey = await getSetting('recaptcha_secret_key');
        if (!secretKey) {
            console.error('Turnstile verification failed: Secret key not configured');
            throw new Error('Turnstile not configured');
        }

        const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

        console.log('Verifying Turnstile token');

        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
        });

        if (!response.ok) {
            console.error(`Turnstile API request failed: ${response.status} ${response.statusText}`);
            throw new Error(`Turnstile API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Turnstile verification response:', { success: data.success, errorCodes: data['error-codes'] });

        if (!data.success) {
            const errorCodes = data['error-codes'] || [];
            console.error('Turnstile verification failed:', errorCodes);

            // Provide more specific error messages
            if (errorCodes.includes('timeout-or-duplicate')) {
                return { success: false, error: '验证超时或重复使用，请重试' };
            } else if (errorCodes.includes('invalid-input-secret')) {
                return { success: false, error: '人机验证配置错误：密钥无效' };
            } else if (errorCodes.includes('invalid-input-response')) {
                return { success: false, error: '验证令牌无效，请重试' };
            }

            return { success: false, error: '人机验证失败，请重试' };
        }

        console.log('Turnstile verified successfully');
        return { success: true };
    } catch (err) {
        console.error('Turnstile verification error:', err);
        throw err;
    }
};

// Verify Altcha payload
export const verifyAltcha = async (payload) => {
    try {
        const hmacKey = await getSetting('altcha_hmac_key');
        if (!hmacKey) {
            console.error('Altcha validation failed: HMAC key not configured');
            throw new Error('Altcha not configured');
        }

        const verified = await altcha.verifySolution(payload, hmacKey, true);

        if (!verified) {
            return { success: false, error: '人机验证失败，请重试' };
        }

        return { success: true };

    } catch (err) {
        console.error('Altcha verification error:', err);
        return { success: false, error: '验证出错' };
    }
}

// Middleware to verify Captcha (Turnstile or Altcha)
export const recaptchaMiddleware = async (req, res, next) => {
    try {
        const enabled = await getSetting('recaptcha_enabled');
        if (!enabled) {
            return next();
        }

        const provider = await getSetting('recaptcha_provider') || 'turnstile';
        console.log(`Verifying captcha with provider: ${provider}`);

        if (provider === 'altcha') {
            const { altcha: altchaPayload } = req.body;
            if (!altchaPayload) {
                return res.status(400).json({ error: '请完成人机验证' });
            }
            const result = await verifyAltcha(altchaPayload);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
        } else {
            // Default to Turnstile
            const { recaptchaToken } = req.body;
            if (!recaptchaToken) {
                return res.status(400).json({ error: '请完成人机验证' });
            }

            const result = await verifyTurnstile(recaptchaToken);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
        }

        next();
    } catch (err) {
        console.error('Captcha middleware error:', err);
        return res.status(500).json({ error: '人机验证出错' });
    }
};

export default recaptchaMiddleware;
