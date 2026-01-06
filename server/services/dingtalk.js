import axios from 'axios';
import crypto from 'crypto';
import { getSetting } from './email.js';

// Send notification to DingTalk
export const sendDingTalkNotification = async (ticket) => {
    try {
        const enabled = await getSetting('dingtalk_enabled');
        if (!enabled || enabled !== true && enabled !== 'true') return;

        const webhook = await getSetting('dingtalk_webhook');
        if (!webhook) return;

        const secret = await getSetting('dingtalk_secret');

        // Construct detailed markdown message
        const typeLabels = {
            'facility': '设施报修',
            'books': '图书借阅',
            'system': '数字资源',
            'environment': '环境卫生',
            'other': '其他'
        };
        const typeLabel = typeLabels[ticket.type] || ticket.type;

        let template = await getSetting('dingtalk_template');

        // Default template if not set
        if (!template || !template.trim()) {
            template = `### 📩 新反馈通知\n\n` +
                `**类型**: {type}\n\n` +
                `**内容**: {content}\n\n` +
                `{location_block}` +
                `{contact_block}` +
                `> [VanceFeedback] #{id}`;
        }

        // Prepare replacement values
        const locationBlock = ticket.location ? `**位置**: ${ticket.location}\n\n` : '';
        const contactBlock = ticket.contact ? `**联系**: ${ticket.contact}\n\n` : '';

        // Replace placeholders
        let messageText = template
            .replace(/{type}/g, typeLabel)
            .replace(/{content}/g, ticket.content || '无内容')
            .replace(/{location}/g, ticket.location || '未提供')
            .replace(/{contact}/g, ticket.contact || '未提供')
            .replace(/{id}/g, ticket.id)
            .replace(/{location_block}/g, locationBlock)
            .replace(/{contact_block}/g, contactBlock)
            .replace(/{title}/g, ticket.title || '新反馈');

        const markdown = {
            title: `新反馈通知: ${typeLabel}`,
            text: messageText
        };

        const payload = {
            msgtype: 'markdown',
            markdown: markdown
        };

        let url = webhook;
        if (secret) {
            const timestamp = Date.now();
            const stringToSign = `${timestamp}\n${secret}`;
            const sign = crypto.createHmac('sha256', secret)
                .update(stringToSign)
                .digest('base64');
            const encodedSign = encodeURIComponent(sign);
            url += `&timestamp=${timestamp}&sign=${encodedSign}`;
        }

        await axios.post(url, payload);
        console.log(`DingTalk notification sent for ticket #${ticket.id}`);
        return true;
    } catch (err) {
        console.error('Failed to send DingTalk notification:', err.message);
        throw err; // Re-throw for testing endpoint
    }
};

// Test function
export const testDingTalkConnection = async (webhook, secret) => {
    try {
        const payload = {
            msgtype: 'text',
            text: {
                content: 'VanceFeedback: 钉钉通知测试成功 ✅'
            }
        };

        let url = webhook;
        if (secret) {
            const timestamp = Date.now();
            const stringToSign = `${timestamp}\n${secret}`;
            const sign = crypto.createHmac('sha256', secret)
                .update(stringToSign)
                .digest('base64');
            const encodedSign = encodeURIComponent(sign);
            url += `&timestamp=${timestamp}&sign=${encodedSign}`;
        }

        await axios.post(url, payload);
        return true;
    } catch (err) {
        throw new Error(`钉钉请求失败: ${err.message}`);
    }
};
