"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQs() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqList = [
    {
      question: "Who is Alfred AI and how does he help me?",
      answer:
        "Alfred AI is your personal training mentor. He reviews your code in real-time, offers strategic hints when you're stuck on hard algorithms, and helps compile weekly progress reports to sharpen your coding skills.",
    },
    {
      question: "Do I need a Wayne Enterprises budget to join?",
      answer:
        "No. You can start training on our Free Tier for ₹0/forever. For serious vigilantes preparing for intense technical interviews, the Pro Plan offers full vault access for ₹299/month.",
    },
    {
      question: "Can I train collaboratively with other vigilantes?",
      answer:
        "Yes. Real-time collaborative coding lets you group up and tackle challenges with other developers in the Arkham Labs network. Learn together, solve together.",
    },
    {
      question: "Is my progress tracking data secure?",
      answer:
        "Absolutely. Your solutions, history, and profile details are encrypted using Wayne Enterprises encryption standards (KEK) and stored securely in isolated multi-tenant databases.",
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-20 border-t border-zinc-900 bg-zinc-950 text-white relative">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-bold font-serif text-white tracking-tight sm:text-4xl uppercase">
            FAQs
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-mono">
            Alfred Gets These Questions a Lot
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqList.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-zinc-900 bg-zinc-900/10 overflow-hidden transition-all hover:border-zinc-800"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-zinc-900/20"
                >
                  <span className="text-sm font-semibold text-white font-sans uppercase tracking-wide">
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[#f59e0b] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 pt-0 border-t border-zinc-900/50 bg-zinc-900/5">
                    <p className="text-sm text-zinc-400 leading-relaxed font-sans pt-4">
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
