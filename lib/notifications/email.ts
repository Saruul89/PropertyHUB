/**
 * Email Service using Resend
 *
 * Required env variables:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_FROM_EMAIL: Sender email (default: onboarding@resend.dev for testing)
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PropertyHub <onboarding@resend.dev>';

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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
    // Check if Resend is configured
    if (!resend || !RESEND_API_KEY) {
        console.warn("[Email] Resend not configured. Set RESEND_API_KEY env variable.");
        return {
            success: false,
            error: "Email service not configured. Set RESEND_API_KEY.",
        };
    }

    // Validate email address
    if (!params.to || !isValidEmail(params.to)) {
        return {
            success: false,
            error: "Invalid or missing email address",
        };
    }

    try {
        console.log("[Email] Sending email via Resend to:", params.to);
        console.log("[Email] Subject:", params.subject);
        console.log("[Email] From:", params.from || FROM_EMAIL);

        const { data, error } = await resend.emails.send({
            from: params.from || FROM_EMAIL,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html || params.text.replace(/\n/g, "<br>"),
        });

        if (error) {
            console.error("[Email] Resend error:", error);
            return {
                success: false,
                error: error.message,
            };
        }

        console.log("[Email] Successfully sent! Message ID:", data?.id);
        return {
            success: true,
            messageId: data?.id,
        };
    } catch (err) {
        console.error("[Email] Full error:", err);

        let errorMessage = "Unknown error";
        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
            errorMessage = JSON.stringify(err);
        }

        console.error("[Email] Send error:", errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if Resend is properly configured
 */
export const isEmailConfigured = (): boolean => {
    return Boolean(RESEND_API_KEY);
};
