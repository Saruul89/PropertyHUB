/**
 * Засварын мэдэгдлийн загвар
 * Үүсгэгч: Төлөв өөрчлөгдсөн үед
 */

import type { MaintenanceUpdateData } from "@/types";

interface EmailTemplate {
  subject: string;
  body: {
    text: string;
    html: string;
  };
}

export function maintenanceUpdateEmail(
  data: MaintenanceUpdateData
): EmailTemplate {
  const subject = "【PropertyHub】Засварын мэдэгдэл";

  const notesText = data.notes ? `\nТэмдэглэл: ${data.notes}\n` : "";

  const text = `${data.tenant_name} танд,

Засварын хүсэлтийн төлөв шинэчлэгдлээ.

Гарчиг: ${data.title}
Төлөв: ${data.status_label}
${notesText}
--
${data.company_name}`;

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    in_progress: "#2563eb",
    completed: "#16a34a",
    cancelled: "#6b7280",
  };

  const statusColor = statusColors[data.status] || "#6b7280";

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; color: white; font-weight: 600; }
        .notes { background: #f3f4f6; border-radius: 6px; padding: 12px; margin-top: 16px; font-style: italic; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Засварын мэдэгдэл</h1>
        </div>
        <div class="content">
            <p>${data.tenant_name} танд,</p>
            <p>Засварын хүсэлтийн төлөв шинэчлэгдлээ.</p>

            <div class="info-box">
                <div class="info-row">
                    <span class="label">Гарчиг</span>
                    <span class="value">${data.title}</span>
                </div>
                <div class="info-row">
                    <span class="label">Төлөв</span>
                    <span class="value">
                        <span class="status-badge" style="background: ${statusColor};">
                            ${data.status_label}
                        </span>
                    </span>
                </div>
            </div>

            ${data.notes ? `<div class="notes">${data.notes}</div>` : ""}

            <div class="footer">
                <p>${data.company_name}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

  return { subject, body: { text, html } };
}
