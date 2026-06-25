export interface WorkspaceClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userImage?: string | null;
  initialHasGmail: boolean;
  initialHasCalendar: boolean;
  initialConversations?: ChatConversation[];
}

export interface EmailItem {
  id: string;
  gmailId: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  body?: string;
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
