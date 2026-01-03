/**
 * Email Service using Resend
 *
 * ⚠️ 注意点:
 * - 送信前に必ず email_notifications フラグをチェック
 * - メールアドレスが空の場合は送信スキップ
 * - 送信失敗時はリトライキューに入れる
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@propertyhub.mn';

interface SendEmailParams {
    to: string;
    subject: string;
    text: string;
    html?: string;
    from?: string;
    fromName?: string;
}

interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Check if email service is configured
    if (!resend) {
        console.warn('Email service not configured. RESEND_API_KEY is missing.');
        return {
            success: false,
            error: 'Email service not configured'
        };
    }

    // Validate email address
    if (!params.to || !isValidEmail(params.to)) {
        return {
            success: false,
            error: 'Invalid or missing email address'
        };
    }

    try {
        const fromAddress = params.fromName
            ? `${params.fromName} <${params.from || EMAIL_FROM}>`
            : params.from || EMAIL_FROM;

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html || params.text.replace(/\n/g, '<br>'),
        });

        if (error) {
            console.error('Failed to send email:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            messageId: data?.id
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Email send error:', errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export { isValidEmail };
