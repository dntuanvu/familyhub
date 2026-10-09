import { Logger } from "@nestjs/common";
import { MailProvider, SendMailArgs } from "../mail.types";

/** Postmark REST — https://postmarkapp.com/developer/api/email-api */
export class PostmarkMailProvider implements MailProvider {
  readonly name = "postmark";
  private readonly log = new Logger("Mail/postmark");

  constructor(
    private readonly serverToken: string,
    private readonly from: string,
    private readonly messageStream: string = "outbound",
  ) {}

  async send({ to, subject, html, text }: SendMailArgs): Promise<void> {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": this.serverToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        From: this.from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        MessageStream: this.messageStream,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.log.error(`Postmark ${res.status}: ${body}`);
      throw new Error(`postmark_send_failed_${res.status}`);
    }
  }
}
