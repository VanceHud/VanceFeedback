import nodemailer from 'nodemailer';
import { getDB } from '../db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../security.js';

// Get setting from database
export const getSetting = async (key) => {
    try {
        const db = getDB();
        const [rows] = await db.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
        if (rows.length === 0) return null;
        try {
            return JSON.parse(rows[0].setting_value);
        } catch {
            return rows[0].setting_value;
        }
    } catch (err) {
        console.error('Error getting setting:', err);
        return null;
    }
};

// Set setting in database
export const setSetting = async (key, value) => {
    const db = getDB();
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // Use UPSERT pattern
    const [existing] = await db.query('SELECT id FROM system_settings WHERE setting_key = ?', [key]);
    if (existing.length > 0) {
        await db.query('UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [valueStr, key]);
    } else {
        await db.query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', [key, valueStr]);
    }
};

// Get all settings
export const getAllSettings = async () => {
    try {
        const db = getDB();
        const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const settings = {};
        for (const row of rows) {
            try {
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch {
                settings[row.setting_key] = row.setting_value;
            }
        }
        return settings;
    } catch (err) {
        console.error('Error getting all settings:', err);
        return {};
    }
};

// Create email transporter
const createTransporter = async () => {
    const smtpHost = await getSetting('smtp_host');
    const smtpPort = await getSetting('smtp_port');
    const smtpUser = await getSetting('smtp_user');
    const smtpPass = await getSetting('smtp_pass');
    const smtpSecure = await getSetting('smtp_secure');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure === true || smtpSecure === 'true',
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
};

// Send email
export const sendEmail = async (to, subject, html) => {
    const transporter = await createTransporter();
    if (!transporter) {
        throw new Error('SMTP not configured');
    }

    const smtpFrom = await getSetting('smtp_from') || await getSetting('smtp_user');

    await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html
    });
};

// Generate verification code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get template from database
const getTemplate = async (key) => {
    try {
        const db = getDB();
        const [rows] = await db.query('SELECT subject, content FROM email_templates WHERE template_key = ?', [key]);
        if (rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (err) {
        console.error(`Error fetching template ${key}:`, err);
        return null;
    }
};

// Replace variables in template
const processTemplate = (template, variables) => {
    let { subject, content } = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        content = content.replace(regex, value);
    }
    return { subject, content };
};

// Send verification code email
export const sendVerificationCode = async (email, code, type) => {
    const typeLabels = {
        'register': '注册账号',
        'email_change': '修改邮箱',
        'password_reset': '重置密码'
    };
    const typeLabel = typeLabels[type] || '验证';

    let subject, html;

    // Try to get dynamic template
    const template = await getTemplate('verification_code');

    if (template) {
        const processed = processTemplate(template, {
            type_label: typeLabel,
            code: code
        });
        subject = processed.subject;
        html = processed.content;
    } else {
        // Fallback to hardcoded
        subject = `【图书馆反馈系统】${typeLabel}验证码`;
        html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">图书馆反馈系统</h2>
                <p>您正在进行${typeLabel}操作，您的验证码是：</p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
                    ${code}
                </div>
                <p style="color: #666;">验证码有效期为 10 分钟，请尽快使用。</p>
                <p style="color: #999; font-size: 12px;">如果这不是您本人的操作，请忽略此邮件。</p>
            </div>
        `;
    }

    await sendEmail(email, subject, html);
};

// Send new feedback notification
export const sendFeedbackNotification = async (ticket) => {
    try {
        const db = getDB();
        // Get all notification emails from admin_notification_emails table
        const [rows] = await db.query('SELECT DISTINCT email FROM admin_notification_emails');
        const notificationEmails = rows.map(r => r.email);

        if (notificationEmails.length === 0) {
            return;
        }

        const typeLabels = {
            'facility': '设施报修',
            'books': '图书借阅',
            'system': '数字资源',
            'environment': '环境卫生',
            'other': '其他'
        };
        const typeLabel = typeLabels[ticket.type] || ticket.type;

        let subject, html;
        const template = await getTemplate('feedback_notification');

        if (template) {
            const processed = processTemplate(template, {
                type_label: typeLabel,
                ticket_id: ticket.id,
                content: ticket.content,
                location: ticket.location || '无',
                contact: ticket.contact || '无'
            });
            subject = processed.subject;
            html = processed.content;
        } else {
            subject = `【新反馈】${typeLabel} - #${ticket.id}`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">收到新的反馈</h2>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">类型</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${typeLabel}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">内容</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${ticket.content}</td>
                        </tr>
                        ${ticket.location ? `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">位置</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${ticket.location}</td>
                        </tr>
                        ` : ''}
                        ${ticket.contact ? `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">联系方式</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${ticket.contact}</td>
                        </tr>
                        ` : ''}
                    </table>
                    <p style="color: #999; font-size: 12px;">请登录后台管理系统处理此反馈。</p>
                </div>
            `;
        }

        for (const email of notificationEmails) {
            try {
                await sendEmail(email.trim(), subject, html);
            } catch (err) {
                console.error(`Failed to send notification to ${email}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Error in sendFeedbackNotification:', err);
    }
};

// Send ticket reply notification
export const sendTicketReplyNotification = async (ticketId, replyContent) => {
    try {
        // 0. Check Master Switch (Feature Flag)
        const featureEnabled = await getSetting('email_notifications_feature_enabled');
        if (featureEnabled !== 'true' && featureEnabled !== true) {
            return;
        }

        // 1. Check global setting
        const globalEnabled = await getSetting('email_notifications_global_enabled');
        if (globalEnabled !== 'true' && globalEnabled !== true) {
            return;
        }

        const db = getDB();

        // 2. Get ticket and user info
        const [tickets] = await db.query(
            `SELECT t.id, t.type, t.content, t.user_id, u.email, u.email_notification_enabled, u.username 
             FROM tickets t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) return;
        const ticket = tickets[0];

        // 3. Apply User Preference (Default to enabled if column is null or 1)
        // Note: The migration adds the column with default 1.
        if (!ticket.email || ticket.email_notification_enabled === 0) {
            return;
        }

        // 4. Generate Unsubscribe Token
        const unsubscribeToken = jwt.sign(
            { userId: ticket.user_id, type: 'unsubscribe' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const siteUrl = await getSetting('site_url');
        const ticketLink = `${siteUrl}/dashboard/my`;
        const unsubscribeLink = `${siteUrl}/api/users/unsubscribe?token=${unsubscribeToken}`;

        const typeLabels = {
            'facility': '设施报修',
            'books': '图书借阅',
            'system': '数字资源',
            'environment': '环境卫生',
            'other': '其他'
        };
        const typeLabel = typeLabels[ticket.type] || ticket.type;

        let subject, html;
        const template = await getTemplate('ticket_reply_notification');

        if (template) {
            const processed = processTemplate(template, {
                type_label: typeLabel,
                ticket_id: ticket.id,
                reply_content: replyContent,
                ticket_link: ticketLink,
                unsubscribe_link: unsubscribeLink
            });
            subject = processed.subject;
            html = processed.content;
        } else {
            subject = `【工单回复】您的工单 #${ticket.id} 有新回复`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">工单有新回复</h2>
                    <p>您好，${ticket.username}：</p>
                    <p>您提交的关于 <strong>${typeLabel}</strong> 的工单 (ID: #${ticket.id}) 收到了管理员的回复：</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px;">
                        ${replyContent}
                    </div>
                    <p>
                        <a href="${ticketLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看详情</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        如果您不希望收到此类通知，可以 <a href="${unsubscribeLink}" style="color: #666;">点击此处取消订阅</a>
                    </p>
                </div>
            `;
        }

        await sendEmail(ticket.email, subject, html);

    } catch (err) {
        console.error('Error sending ticket reply notification:', err);
    }
};
