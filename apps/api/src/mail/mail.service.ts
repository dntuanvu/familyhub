import { Injectable, Logger } from "@nestjs/common";
import type { MailLocale, MailProvider } from "./mail.types";
import { renderPasswordResetEmail } from "./templates/password-reset";
import { ConsoleMailProvider } from "./providers/console.provider";
import { ResendMailProvider } from "./providers/resend.provider";
import { PostmarkMailProvider } from "./providers/postmark.provider";

const DEFAULT_FROM = "Family Hub <onboarding@resend.dev>";

function pickProvider(log: Logger): MailProvider {
  const explicit = (process.env.MAIL_PROVIDER ?? "").toLowerCase();
  const from = process.env.MAIL_FROM ?? DEFAULT_FROM;

  if (explicit === "resend" || (!explicit && process.env.RESEND_API_KEY)) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      log.warn("MAIL_PROVIDER=resend but RESEND_API_KEY missing — falling back to console");
      return new ConsoleMailProvider();
    }
    log.log(`using Resend (from=${from})`);
    return new ResendMailProvider(key, from);
  }
  if (explicit === "postmark" || (!explicit && process.env.POSTMARK_SERVER_TOKEN)) {
    const key = process.env.POSTMARK_SERVER_TOKEN;
    if (!key) {
      log.warn("MAIL_PROVIDER=postmark but POSTMARK_SERVER_TOKEN missing — falling back to console");
      return new ConsoleMailProvider();
    }
    log.log(`using Postmark (from=${from})`);
    return new PostmarkMailProvider(key, from, process.env.POSTMARK_STREAM ?? "outbound");
  }

  log.log("using console mail provider (set RESEND_API_KEY or POSTMARK_SERVER_TOKEN to send real email)");
  return new ConsoleMailProvider();
}

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly provider: MailProvider = pickProvider(this.log);

  /**
   * Attempt to send a password-reset email. Failures are logged but swallowed
   * so the AuthService can still return `{ ok: true }` without leaking which
   * emails are registered.
   */
  async sendPasswordReset(args: {
    to: string;
    resetUrl: string;
    name?: string | null;
    locale?: MailLocale;
  }): Promise<void> {
    try {
      const { subject, html, text } = renderPasswordResetEmail({
        resetUrl: args.resetUrl,
        name: args.name,
        locale: args.locale,
      });
      await this.provider.send({ to: args.to, subject, html, text });
    } catch (e) {
      this.log.error(
        `password-reset email to ${args.to} failed via ${this.provider.name}: ${(e as Error).message}`,
      );
    }
  }
}
