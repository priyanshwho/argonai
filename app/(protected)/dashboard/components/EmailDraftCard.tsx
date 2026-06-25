import React, { useState, useEffect } from "react";
import { Check, RefreshCw, Paperclip, Trash2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailAttachment } from "./types";
import { EmailThreadAccordion } from "./EmailThreadAccordion";
import { cleanErrorMessage } from "./utils";

export function EmailDraftCard({
  to: initialTo,
  subject: initialSubject,
  body: initialBody,
  attachments: initialAttachments = [],
  threadId,
  toolCallId,
  addToolResult,
  isLoading
}: {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  threadId?: string | null;
  toolCallId: string;
  addToolResult: (args: any) => void;
  isLoading?: boolean;
}) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<EmailAttachment[]>(initialAttachments);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'draft' | 'refining' | 'sending' | 'sent' | 'error'>('draft');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state with props while loading (streaming)
  useEffect(() => {
    if (isLoading) {
      setTo(initialTo || '');
      setSubject(initialSubject || '');
      setBody(initialBody || '');
      setAttachments(initialAttachments || []);
    }
  }, [initialTo, initialSubject, initialBody, initialAttachments, isLoading]);

  const handleRefine = async (tone: string) => {
    setStatus('refining');
    try {
      const res = await fetch('/api/emails/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, tone, to })
      });
      const data = await res.json();
      if (data.refinedBody) {
        setBody(data.refinedBody);
        setStatus('draft');
      } else {
        throw new Error(data.error || 'Failed to refine email');
      }
    } catch (err: any) {
      setErrorMessage(cleanErrorMessage(err.message || 'Failed to refine email'));
      setStatus('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments(prev => [...prev, { filename: file.name, content: base64 }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, attachments, threadId })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        addToolResult({
          tool: 'draft_email' as any,
          toolCallId,
          output: { success: true, message: 'Email sent successfully' }
        });
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      setErrorMessage(cleanErrorMessage(err.message || 'Failed to send email'));
      setStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl border border-border bg-card/45 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-pulse my-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/40 w-16 uppercase">To:</span>
            <div className="h-4 flex-1 bg-muted/65 rounded" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/40 w-16 uppercase">Subject:</span>
            <div className="h-4 flex-1 bg-muted/65 rounded" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground/40 uppercase block">Message Body:</span>
            <div className="space-y-2 p-3 bg-muted/20 border border-border/20 rounded-xl">
              <div className="h-3 w-full bg-muted/65 rounded" />
              <div className="h-3 w-5/6 bg-muted/65 rounded" />
              <div className="h-3 w-4/5 bg-muted/65 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 my-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draft Email (Google Mail)</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'sent' && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Sent</span>}
          {status === 'sending' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Sending...</span>}
          {status === 'refining' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Refining...</span>}
        </div>
      </div>

      {threadId && <EmailThreadAccordion threadId={threadId} />}

      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-muted-foreground/60 w-16 uppercase">To:</span>
          {isEditing ? (
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-base focus:outline-none"
            />
          ) : (
            <span className="text-base font-semibold text-foreground">{to}</span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-muted-foreground/60 w-16 uppercase">Subject:</span>
          {isEditing ? (
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-base focus:outline-none"
            />
          ) : (
            <span className="text-base font-bold text-foreground">{subject}</span>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-muted-foreground/60 uppercase block">Message Body:</span>
          {isEditing ? (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full bg-background border border-border rounded-lg p-3 text-base focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-base whitespace-pre-wrap text-foreground/90 max-h-60 overflow-y-auto leading-relaxed select-text">
              {body}
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted border border-border/80 rounded-lg px-2.5 py-1 text-xs">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate text-foreground/80">{att.filename}</span>
                {status === 'draft' && (
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive cursor-pointer ml-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'draft' && (
        <div className="pt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/40 border border-border/40 rounded-xl">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase px-2">Refine Tone:</span>
            <button onClick={() => handleRefine('professional')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">👔 Prof</button>
            <button onClick={() => handleRefine('friendly')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">😊 Friendly</button>
            <button onClick={() => handleRefine('casual')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">⚡ Casual</button>
            <button onClick={() => handleRefine('short')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">🤏 Short</button>
            <button onClick={() => handleRefine('long')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">📖 Long</button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded-lg hover:bg-muted/50 transition">
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach File</span>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="text-xs py-1.5 h-8 border border-border rounded-xl cursor-pointer"
              >
                {isEditing ? 'Save Edit' : 'Edit Draft'}
              </Button>
              <Button
                onClick={handleSend}
                className="text-xs py-1.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer flex items-center gap-1.5 font-bold shadow-md"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
