export interface WorkspaceClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userImage?: string | null;
  initialHasGmail: boolean;
  initialHasCalendar: boolean;
  initialConversations?: ChatConversation[];
  activeChatIdParam?: string;
  isAdmin?: boolean;
}

export interface EmailItem {
  id: string;
  gmailId: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  body?: string;
  htmlBody?: string;
  receivedAt: string;
}

export interface CalendarItem {
  id: string;
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: any; // string[] JSON
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: Array<{ id: string; role: "user" | "assistant" | "system"; content: string }>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 data
}

export type OutreachRecipientStatus = "draft" | "generating" | "approved" | "sent" | "error";
export type OutreachGroupStatus = "draft" | "generating" | "ready" | "sending" | "completed";

export interface OutreachRecipientItem {
  id: string;
  groupId: string;
  companyName: string;
  email: string;
  customNotes?: string | null;
  subject?: string | null;
  body?: string | null;
  status: OutreachRecipientStatus;
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachGroupItem {
  id: string;
  userId?: string;
  name: string;
  instructions: string;
  attachmentName?: string | null;
  hasAttachment?: boolean;
  status: OutreachGroupStatus;
  recipients?: OutreachRecipientItem[];
  _count?: {
    recipients: number;
  };
  createdAt: string;
  updatedAt: string;
}
