"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

export default function FAQs() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const faqList = [
    {
      question: "How does ARGON AI integrate with Gmail & Google Calendar?",
      answer:
        "ARGON AI is a multi-tenant AI command center that uses OAuth 2.0 to connect to your Google Workspace. It syncs your email threads and calendar events into an isolated, encrypted cache — giving the AI assistant context without ever storing plain-text credentials.",
    },
    {
      question: "How does the AI assistant draft my email responses?",
      answer:
        "The AI assistant (powered by Gemini) reads your synced email cache to understand thread context and tone. Describe what you want in plain language and it generates a full draft reply. No email is sent without your explicit confirmation.",
    },
    {
      question: "Is my email and calendar data fully isolated and private?",
      answer:
        "Yes. ARGON AI uses double-envelope encryption — each tenant's data is wrapped with a unique DEK, which is further encrypted by your private KEK. Even on shared infrastructure, your data is completely unreadable by anyone else, including platform operators.",
    },
    {
      question: "How fast does real-time sync update my workspace data?",
      answer:
        "ARGON AI registers Google Pub/Sub webhooks during setup. Whenever a message arrives or a calendar event changes, Google pushes a notification instantly to your endpoint — so the AI always works with the latest data.",
    },
    {
      question: "Do I need a credit card to start the Free Tier?",
      answer:
        "No. The Free Tier requires no payment information. You get basic Gmail and Calendar sync, standard AI chat, and enterprise-grade KEK security. Upgrade to Pro whenever you need real-time sync, AI email drafting, and priority processing.",
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section 
      id="faqs" 
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center py-10 md:py-12 border-t border-border bg-background text-foreground relative overflow-hidden"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center opacity-[0] dark:opacity-[0.5] pointer-events-none blur-md dark:blur-none"
        style={{ 
          backgroundImage: "url('/FAQ-bgm.png')",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl w-full px-6 sm:px-9 lg:px-14">
        {/* Title Block */}
        <div className="text-center mb-9 md:mb-11">
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-medium text-foreground/95 tracking-tighter font-sans text-center mt-6"
            style={{
              textShadow: "0 0 20px rgba(196, 30, 58, 0.6), 0 0 40px rgba(196, 30, 58, 0.3)"
            }}
          >
            FAQs
          </motion.h2>
          <motion.p 
            initial={{ y: -15, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: -15, opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-base md:text-lg text-center font-medium text-transparent bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text font-sans max-w-2xl mx-auto mt-4 mb-12"
          >
            Got questions? We&apos;ve got answers.
          </motion.p>
        </div>

        {/* Accordions */}
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {faqList.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative transition-all duration-300 group ${isOpen ? "active-faq" : ""}`}
              >
                {/* Outer Clipped Border Container */}
                <div
                  className="bg-[#c41e3a]/90 p-[1px] md:p-[1.5px] transition-all duration-300"
                  style={{
                    clipPath: "polygon(12px 0px, calc(100% - 12px) 0px, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0px calc(100% - 12px), 0px 12px)"
                  }}
                >
                  {/* Inner Clipped Content Container */}
                  <div
                    className="bg-card dark:bg-black/95 backdrop-blur-md overflow-hidden relative w-full h-full"
                  >
                    {/* Lines overlay background */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.06] -z-10 lines-card-bg"
                      style={{
                        backgroundImage: "url('/lines.png')",
                        backgroundRepeat: "repeat",
                        backgroundPosition: "center",
                        backgroundSize: "150px",
                      }}
                    />

                    <motion.button
                      onClick={() => toggleFAQ(index)}
                      className={`w-full flex items-center justify-between p-5 md:p-[1.1rem] text-left cursor-pointer transition-colors ${
                        isOpen ? "border-b border-border/40 bg-muted/20" : "border-b border-transparent bg-transparent"
                      }`}
                      whileHover={{
                        backgroundColor: "rgba(120, 120, 120, 0.05)",
                      }}
                    >
                      <span 
                        className="text-[1.1rem] font-medium text-foreground/90 font-sans tracking-wide leading-snug pr-4 transition-all lines-card-title"
                      >
                        {faq.question}
                      </span>
                      
                      <motion.div
                        className="text-primary text-[1.5rem] font-light h-6 w-6 flex items-center justify-center ml-2.5 shrink-0 select-none"
                        animate={{
                          rotate: isOpen ? 180 : 0,
                        }}
                        transition={{
                          duration: 0.4,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          className="bg-muted/10 dark:bg-black/20 overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                              height: {
                                duration: 0.4,
                              },
                              opacity: {
                                duration: 0.5,
                                delay: 0.1,
                              },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: {
                                duration: 0.3,
                              },
                              opacity: {
                                duration: 0.2,
                              },
                            },
                          }}
                        >
                          <motion.div 
                            className="px-[1.1rem] pb-[1.1rem] pt-[0.4rem] text-muted-foreground text-[1rem] leading-relaxed font-sans"
                            initial={{ y: 10 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            {faq.answer}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
