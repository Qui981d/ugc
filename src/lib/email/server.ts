import nodemailer from 'nodemailer'

/* ============================================================
   Transactional email — server only.

   MOSH's mail is hosted at Infomaniak, so this is plain SMTP
   (mail.infomaniak.com). Credentials come from the environment and
   never reach the browser.
   ============================================================ */

const HOST = process.env.SMTP_HOST || 'mail.infomaniak.com'
// 465 = implicit TLS, which is what Infomaniak documents for SMTP.
const PORT = Number(process.env.SMTP_PORT || 465)

export function emailConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

let cached: nodemailer.Transporter | null = null

function transport() {
    if (cached) return cached
    cached = nodemailer.createTransport({
        host: HOST,
        port: PORT,
        secure: PORT === 465,
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASSWORD!,
        },
    })
    return cached
}

/**
 * Managed brands are created with a synthetic address so the account can exist
 * without the client ever logging in. Those must never be mailed.
 */
export function isDeliverable(email: string | null | undefined): boolean {
    if (!email) return false
    if (email.endsWith('@managed.mosh.local')) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const BASE_STYLE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;`

function render({ title, message, actionUrl, actionLabel }: {
    title: string
    message?: string
    actionUrl?: string
    actionLabel?: string
}) {
    return `
<div style="${BASE_STYLE}background:#f2f2f1;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e2e1;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #e2e2e1;">
      <span style="${BASE_STYLE}font-size:15px;font-weight:700;letter-spacing:-0.02em;color:#1a1a1a;">MOSH</span>
    </div>
    <div style="padding:24px;">
      <h1 style="${BASE_STYLE}margin:0 0 8px;font-size:17px;font-weight:600;color:#1a1a1a;">${escapeHtml(title)}</h1>
      ${message ? `<p style="${BASE_STYLE}margin:0;font-size:14px;line-height:1.55;color:#6b6b6b;">${escapeHtml(message)}</p>` : ''}
      ${actionUrl ? `
      <a href="${actionUrl}" style="${BASE_STYLE}display:inline-block;margin-top:20px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 18px;border-radius:8px;">
        ${escapeHtml(actionLabel || 'Ouvrir dans MOSH')}
      </a>` : ''}
    </div>
    <div style="padding:14px 24px;border-top:1px solid #e2e2e1;">
      <p style="${BASE_STYLE}margin:0;font-size:11.5px;color:#9b9b9b;">
        Notification automatique de la plateforme MOSH.
      </p>
    </div>
  </div>
</div>`
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
    ))
}

export async function sendNotificationEmail(opts: {
    to: string
    title: string
    message?: string
    actionUrl?: string
    actionLabel?: string
}): Promise<void> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER!
    await transport().sendMail({
        from: `MOSH <${from}>`,
        to: opts.to,
        subject: opts.title,
        text: [opts.title, opts.message, opts.actionUrl].filter(Boolean).join('\n\n'),
        html: render(opts),
    })
}
