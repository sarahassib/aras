export interface OutgoingEmail {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  name: string;
  send(email: OutgoingEmail): Promise<void>;
}
