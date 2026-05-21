import type {
  SupportAttachment,
  SupportTicket,
} from "@repo/database/generated/prisma/client";

export interface Ticket extends SupportTicket {
  attachments: SupportAttachment[];
}
