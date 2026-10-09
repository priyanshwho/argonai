"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  AlertCircle,
  Loader2,
  Edit3,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachGroupItem } from "./types";

interface EditGroupDialogProps {
  isOpen: boolean;
  group: OutreachGroupItem;
  onClose: () => void;
  onSuccess: (updatedGroup: OutreachGroupItem) => void;
}

export function EditGroupDialog({
  isOpen,
  group,
  onClose,
  onSuccess,
}: EditGroupDialogProps) {
  const [name, setName] = useState(group.name);
  const [instructions, setInstructions] = useState(group.instructions || "");
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(group.name);
    setInstructions(group.instructions || "");
    setFile(null);
    setRemoveAttachment(false);
    setErrorMsg(null);
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("Please upload a PDF file only");
        return;
      }
      if (selected.size > 15 * 1024 * 1024) {
        setErrorMsg("PDF size must be under 15MB");
        return;
      }
      setFile(selected);
      setRemoveAttachment(false);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Group name is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("instructions", instructions.trim());
      if (removeAttachment) {
        formData.append("removeAttachment", "true");
      } else if (file) {
        formData.append("attachment", file);
      }

      const res = await fetch(`/api/outreach/groups/${group.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update group");
      }

      const updated = await res.json();
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Edit Outreach Group
              </h2>
              <p className="text-xs text-muted-foreground">
                Update pitch instructions or replace group PDF attachment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Group Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1.5 h-9 text-xs px-3 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-xs font-medium text-foreground">
              AI Generation Guidance &amp; Pitch Context
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Instructions for cold email copy generation..."
              className="w-full mt-1.5 p-3 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* PDF Attachment */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Group PDF Attachment
            </label>
            {group.attachmentName && !removeAttachment && !file ? (
              <div className="mt-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary truncate">
                    {group.attachmentName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-primary hover:underline cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setRemoveAttachment(true)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : file ? (
              <div className="mt-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary truncate">
                    {file.name} (New)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all">
                <Upload className="w-5 h-5 text-muted-foreground mb-1.5" />
                <span className="text-xs font-medium text-foreground">
                  Upload new PDF
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Attach PDF for this group (up to 15MB)
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="h-8 text-xs px-5 gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Edit3 className="w-3.5 h-3.5" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
