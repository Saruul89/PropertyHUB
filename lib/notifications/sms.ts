/**
 * SMS Service
 *
 * ⚠️ 注意点:
 * - 送信前に必ず sms_notifications フラグをチェック
 * - 電話番号が必須（tenants.phone）
 * - 70文字以内を目標（キリル文字・日本語対応）
 * - 送信失敗時はリトライキューに入れる
 *
 * モンゴル向け推奨: Messagepro.mn, Nexmo (Vonage)
 */

const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'PropertyHub';

interface SendSmsParams {
    to: string;
    message: string;
}

interface SendSmsResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    // Check if SMS service is configured
    if (!SMS_API_URL || !SMS_API_KEY) {
        console.warn('SMS service not configured. SMS_API_URL or SMS_API_KEY is missing.');
        return {
            success: false,
            error: 'SMS service not configured'
        };
    }

    // Validate phone number
    if (!params.to || !isValidPhone(params.to)) {
        return {
            success: false,
            error: 'Invalid or missing phone number'
        };
    }

    // Check message length (warn if over 70 characters for non-ASCII)
    const charCount = params.message.length;
    if (charCount > 70) {
        console.warn(`SMS message is ${charCount} characters (recommended: 70 max for non-ASCII)`);
    }

    try {
        // Format phone number (remove spaces, dashes, etc.)
        const formattedPhone = formatPhoneNumber(params.to);

        // Generic API call - adjust based on your SMS provider
        const response = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SMS_API_KEY}`,
            },
            body: JSON.stringify({
                to: formattedPhone,
                from: SMS_SENDER_ID,
                message: params.message,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('SMS API error:', response.status, errorText);
            return {
                success: false,
                error: `SMS API error: ${response.status}`
            };
        }

        const data = await response.json();

        return {
            success: true,
            messageId: data.id || data.message_id
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('SMS send error:', errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }
}

function isValidPhone(phone: string): boolean {
    // Basic phone number validation
    // Adjust regex based on your target country format
    const phoneRegex = /^[+]?[\d\s-]{8,15}$/;
    return phoneRegex.test(phone);
}

function formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and parentheses
    let formatted = phone.replace(/[\s\-()]/g, '');

    // Add Mongolia country code if not present
    if (!formatted.startsWith('+')) {
        if (formatted.startsWith('976')) {
            formatted = '+' + formatted;
        } else {
            formatted = '+976' + formatted;
        }
    }

    return formatted;
}

export { isValidPhone, formatPhoneNumber };
