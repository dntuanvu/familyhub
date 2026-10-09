import type { MailLocale } from "../mail.types";

interface Copy {
  subject: string;
  heading: string;
  greeting: (name: string) => string;
  intro: string;
  button: string;
  expiry: string;
  fallback: string;
  footer: string;
  brand: string;
}

const COPY: Record<MailLocale, Copy> = {
  en: {
    subject: "Reset your Family Hub password",
    heading: "Reset your password",
    greeting: (name) => (name ? `Hi ${name},` : "Hi,"),
    intro: "Someone (hopefully you) asked to reset the password on your Family Hub account. Pick a new password with the button below.",
    button: "Reset my password",
    expiry: "This link expires in 1 hour. If you didn't ask for a reset, you can safely ignore this email.",
    fallback: "If the button doesn't work, copy and paste this link:",
    footer: "— The Family Hub team",
    brand: "Family Hub",
  },
  zh: {
    subject: "重置您的 Family Hub 密码",
    heading: "重置密码",
    greeting: (name) => (name ? `您好 ${name},` : "您好,"),
    intro: "有人(希望是您)请求重置您的 Family Hub 账户密码。点击下方按钮来设置新密码。",
    button: "重置密码",
    expiry: "此链接 1 小时内有效。如果不是您本人请求,可以忽略此邮件。",
    fallback: "如果按钮无法点击,请复制以下链接:",
    footer: "— Family Hub 团队",
    brand: "Family Hub",
  },
  vi: {
    subject: "Đặt lại mật khẩu Family Hub của bạn",
    heading: "Đặt lại mật khẩu",
    greeting: (name) => (name ? `Xin chào ${name},` : "Xin chào,"),
    intro: "Ai đó (hy vọng là bạn) đã yêu cầu đặt lại mật khẩu tài khoản Family Hub. Nhấn nút bên dưới để đặt mật khẩu mới.",
    button: "Đặt lại mật khẩu",
    expiry: "Liên kết này hết hạn sau 1 giờ. Nếu bạn không yêu cầu, bạn có thể bỏ qua email này.",
    fallback: "Nếu nút không hoạt động, hãy sao chép liên kết này:",
    footer: "— Đội ngũ Family Hub",
    brand: "Family Hub",
  },
};

export interface PasswordResetTemplateArgs {
  resetUrl: string;
  name?: string | null;
  locale?: MailLocale;
}

export function renderPasswordResetEmail(args: PasswordResetTemplateArgs) {
  const c = COPY[args.locale ?? "en"] ?? COPY.en;
  const name = (args.name ?? "").trim();

  const html = `<!doctype html>
<html lang="${args.locale ?? "en"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(c.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fff7ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:28px 28px 0;text-align:center;">
                <div style="font-size:36px;line-height:1;">👨‍👩‍👧‍👦</div>
                <div style="margin-top:6px;font-weight:700;color:#d14e8f;font-size:16px;letter-spacing:0.2px;">${escapeHtml(c.brand)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 0;">
                <h1 style="margin:0 0 14px;font-size:22px;color:#1f2937;">${escapeHtml(c.heading)}</h1>
                <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#1f2937;">${escapeHtml(c.greeting(name))}</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#374151;">${escapeHtml(c.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;text-align:center;">
                <a href="${escapeAttr(args.resetUrl)}" style="display:inline-block;background:#d14e8f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;">${escapeHtml(c.button)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 0;">
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${escapeHtml(c.fallback)}</p>
                <p style="margin:0 0 18px;font-size:12px;color:#6b7280;word-break:break-all;"><a href="${escapeAttr(args.resetUrl)}" style="color:#d14e8f;text-decoration:underline;">${escapeHtml(args.resetUrl)}</a></p>
                <p style="margin:0 0 22px;font-size:13px;color:#6b7280;">${escapeHtml(c.expiry)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;border-top:1px solid #f3f4f6;">
                <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">${escapeHtml(c.footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    c.greeting(name),
    "",
    c.intro,
    "",
    `${c.button}: ${args.resetUrl}`,
    "",
    c.expiry,
    "",
    c.footer,
  ].join("\n");

  return { subject: c.subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}
function escapeAttr(s: string): string { return escapeHtml(s); }
