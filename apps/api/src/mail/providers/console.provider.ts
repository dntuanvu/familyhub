import { Logger } from "@nestjs/common";
import { MailProvider, SendMailArgs } from "../mail.types";

/** Default when no API key is configured. Prints the message to the server log. */
export class ConsoleMailProvider implements MailProvider {
  readonly name = "console";
  private readonly log = new Logger("Mail/console");

  async send({ to, subject, text }: SendMailArgs): Promise<void> {
    this.log.log(
      `\n--- email (dev) ---\nTo: ${to}\nSubject: ${subject}\n${text}\n--- end email ---`,
    );
  }
}
