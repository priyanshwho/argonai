import React, { useState, useEffect } from "react";
import { Search, Calendar, ShieldAlert, Sparkles, AlertTriangle, Check, RefreshCw, AlertCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanErrorMessage } from "./utils";

export function CalendarDraftCard({
  title: initialTitle,
  startTime: initialStartTime,
  endTime: initialEndTime,
  attendees: initialAttendees,
  toolCallId,
  addToolResult,
  isLoading,
  isAlreadyCreated,
}: {
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  toolCallId: string;
  addToolResult: (args: any) => void;
  isLoading?: boolean;
  isAlreadyCreated?: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [attendees, setAttendees] = useState<string[]>(initialAttendees || []);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'checking' | 'ready' | 'creating' | 'created' | 'conflict' | 'error'>(
    isAlreadyCreated ? 'created' : 'checking'
  );
  const [currentStep, setCurrentStep] = useState(0); 
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state with props while loading (streaming)
  useEffect(() => {
    if (isLoading) {
      setTitle(initialTitle || '');
      setStartTime(initialStartTime || '');
      setEndTime(initialEndTime || '');
      setAttendees(initialAttendees || []);
    }
  }, [initialTitle, initialStartTime, initialEndTime, initialAttendees, isLoading]);

  const isReminder = !attendees || attendees.length === 0 || 
    title.toLowerCase().includes("reminder") || 
    title.toLowerCase().includes("workout") || 
    title.toLowerCase().includes("task") || 
    title.toLowerCase().includes("remind");
  const [refiningAlternative, setRefiningAlternative] = useState(false);

  const steps = [
    { text: "Parsing date and time range...", icon: Search },
    { text: "Checking calendar availability...", icon: Calendar },
    { text: "Analyzing conflicts...", icon: ShieldAlert }
  ];

  // Convert a UTC ISO string to the value format required by datetime-local input
  // (YYYY-MM-DDTHH:mm in LOCAL time so the browser shows the correct local time)
  const toLocalDateTimeInput = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const offsetMs = d.getTimezoneOffset() * 60000;
      const local = new Date(d.getTime() - offsetMs);
      return local.toISOString().slice(0, 16);
    } catch {
      return isoString.slice(0, 16);
    }
  };

  const runConflictValidation = async (start: string, end: string) => {
    setStatus('checking');
    setCurrentStep(0);
    
    for (let step = 0; step < 3; step++) {
      setCurrentStep(step);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setCurrentStep(3);

    try {
      const res = await fetch('/api/events/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: start, endTime: end })
      });
      const data = await res.json();
      if (data.hasConflict) {
        setConflicts(data.conflicts);
        setStatus('conflict');
      } else {
        setConflicts([]);
        setStatus('ready');
      }
    } catch (err: any) {
      setErrorMessage(cleanErrorMessage(err.message || 'Conflict check failed'));
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!isAlreadyCreated && !isLoading && startTime && endTime) {
      runConflictValidation(startTime, endTime);
    }
  }, [isLoading]);

  const handleSuggestAlternative = async () => {
    setRefiningAlternative(true);
    try {
      const res = await fetch('/api/events/alternative-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime, endTime })
      });
      const data = await res.json();
      if (data.alternativeSlot) {
        setStartTime(data.alternativeSlot.startTime);
        setEndTime(data.alternativeSlot.endTime);
        setRefiningAlternative(false);
        runConflictValidation(data.alternativeSlot.startTime, data.alternativeSlot.endTime);
      } else {
        throw new Error(data.error || 'No alternative slots found');
      }
    } catch (err: any) {
      setErrorMessage(cleanErrorMessage(err.message || 'Failed to find alternative slot'));
      setStatus('error');
      setRefiningAlternative(false);
    }
  };

  const handleCreate = async () => {
    setStatus('creating');
    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startTime, endTime, attendees })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('created');
        addToolResult({
          tool: 'draft_calendar_event' as any,
          toolCallId,
          output: { success: true, message: 'Event scheduled successfully' }
        });
      } else {
        throw new Error(data.error || 'Failed to schedule event');
      }
    } catch (err: any) {
      setErrorMessage(cleanErrorMessage(err.message || 'Failed to schedule event'));
      setStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl border border-border bg-card/45 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-pulse my-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            <div className="h-3 w-40 bg-muted rounded" />
          </div>
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/40 w-20 uppercase">Title:</span>
            <div className="h-4 flex-1 bg-muted/65 rounded" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/40 w-20 uppercase">Start:</span>
            <div className="h-4 flex-1 bg-muted/65 rounded" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/40 w-20 uppercase">End:</span>
            <div className="h-4 flex-1 bg-muted/65 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 my-3 select-text">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          {isReminder ? (
            <Bell className="h-4 w-4 text-amber-500 animate-bounce" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isReminder ? "Personal Reminder Draft" : "Draft Calendar Event (Google Calendar)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'created' && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {isReminder ? 'Reminder Set' : 'Scheduled'}</span>}
          {status === 'creating' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> {isReminder ? 'Creating reminder...' : 'Scheduling...'}</span>}
        </div>
      </div>

      {status === 'checking' && (
        <div className="p-6 border border-border/40 bg-muted/20 rounded-xl space-y-4">
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPending = idx > currentStep;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={idx} className="flex items-center gap-3 transition-opacity duration-300">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                    isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                    isActive ? "bg-primary/10 border-primary/30 text-primary animate-pulse" :
                    "bg-muted border-border text-muted-foreground/60"
                  }`}>
                    {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </div>
                  <span className={`text-xs ${
                    isCompleted ? "text-foreground/70 line-through decoration-muted-foreground/30" :
                    isActive ? "text-foreground font-semibold" :
                    "text-muted-foreground/60"
                  }`}>{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status !== 'checking' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">Title:</span>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-base focus:outline-none"
              />
            ) : (
              <span className="text-base font-semibold text-foreground">{title}</span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">Start:</span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={toLocalDateTimeInput(startTime)}
                onChange={e => setStartTime(new Date(e.target.value).toISOString())}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-base focus:outline-none"
              />
            ) : (
              <span className="text-base text-foreground">{new Date(startTime).toLocaleString()}</span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">End:</span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={toLocalDateTimeInput(endTime)}
                onChange={e => setEndTime(new Date(e.target.value).toISOString())}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-base focus:outline-none"
              />
            ) : (
              <span className="text-base text-foreground">{new Date(endTime).toLocaleString()}</span>
            )}
          </div>

          {attendees && attendees.length > 0 && (
            <div className="flex gap-2 items-start">
              <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase mt-0.5">Attendees:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {attendees.map((email, idx) => (
                  <span key={idx} className="bg-muted border border-border/80 rounded-lg px-2 py-0.5 text-xs text-foreground/80">{email}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'conflict' && (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold">⚠️ Calendar Conflict Detected</p>
              <p className="text-xs text-destructive/80">The proposed slot overlaps with these events in your schedule:</p>
            </div>
          </div>
          <div className="space-y-1.5 pl-6">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="text-xs text-foreground/80 leading-relaxed border-l-2 border-destructive/50 pl-2">
                <strong>{conf.title}</strong>
                <span className="text-muted-foreground text-[10px] block">
                  {new Date(conf.startTime).toLocaleTimeString()} - {new Date(conf.endTime).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer"
            >
              Edit proposed time manually
            </button>
            <Button
              onClick={handleSuggestAlternative}
              disabled={refiningAlternative}
              className="text-xs py-1.5 h-8 border border-border bg-background hover:bg-muted text-foreground rounded-xl flex items-center gap-1 cursor-pointer"
            >
              {refiningAlternative ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
              <span>Find Alternative Slot</span>
            </Button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
          <Check className="h-4 w-4 shrink-0" />
          <span>✓ Time Slot is Available! No conflicts found.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {(status === 'ready' || isEditing || status === 'conflict') && (
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                runConflictValidation(startTime, endTime);
              } else {
                setIsEditing(true);
              }
            }}
            variant="outline"
            className="text-xs py-1.5 h-8 border border-border rounded-xl cursor-pointer"
          >
            {isEditing ? 'Save & Recheck' : 'Edit Event'}
          </Button>
          {!isEditing && status !== 'conflict' && status !== 'created' && (
            <Button
              onClick={handleCreate}
              className="text-xs py-1.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer flex items-center gap-1 font-bold shadow-md"
            >
              <span>{isReminder ? "Create Reminder" : "Confirm & Schedule"}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
