export type MailLocale = "en" | "zh" | "vi";

export interface SendMailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailProvider {
  readonly name: string;
  send(args: SendMailArgs): Promise<void>;
}
