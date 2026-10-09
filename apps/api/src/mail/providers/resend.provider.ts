import { Logger } from "@nestjs/common";
import { MailProvider, SendMailArgs } from "../mail.types";

/** Resend REST API — https://resend.com/docs/api-reference/emails/send-email */
export class ResendMailProvider implements MailProvider {
  readonly name = "resend";
  private readonly log = new Logger("Mail/resend");

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send({ to, subject, html, text }: SendMailArgs): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.log.error(`Resend ${res.status}: ${body}`);
      throw new Error(`resend_send_failed_${res.status}`);
    }
  }
}
