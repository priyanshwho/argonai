"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQs() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqList = [
    {
      question: "What is ARGON AI and how does it connect to my Workspace?",
      answer:
        "ARGON AI is an AI-powered command center that securely interfaces with your Gmail and Google Calendar. It syncs messages, digests threads, and maps appointments inside a single dashboard panel.",
    },
    {
      question: "How does the AI Assistant automate my tasks?",
      answer:
        "The integrated AI assistant utilizes advanced models (like Gemini) to interpret your text prompts. It reads synced inbox caches to draft email responses, cross-references availability, and books Google Calendar slots dynamically.",
    },
    {
      question: "Is my personal email and calendar data secure?",
      answer:
        "Absolutely. All service synchronization is handled using secure OAuth tokens. Synced database caches are isolated and encrypted under double-envelope standards using your private environment key (CORSAIR_KEK).",
    },
    {
      question: "Do I need a credit card to sign up?",
      answer:
        "No. You can sign up and get started on our Free Tier without entering any payment credentials. Upgrade to Pro only when you need real-time synchronization and priority AI tools.",
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-32 md:py-40 border-t border-border bg-background text-foreground relative">
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12">
        <div className="text-center space-y-5 mb-20 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif text-foreground tracking-tight uppercase leading-tight">
            Frequently Asked<br className="hidden sm:block" /> Questions
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto font-sans leading-relaxed">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-5">
          {faqList.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-border/60 bg-card/25 overflow-hidden transition-all hover:border-border"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-7 text-left transition-colors hover:bg-muted/10 cursor-pointer"
                >
                  <span className="text-base md:text-lg font-semibold text-foreground font-sans uppercase tracking-wide pr-4">
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-7 pb-7 pt-0 border-t border-border/40 bg-card/10 animate-in fade-in duration-200">
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-sans pt-5">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
