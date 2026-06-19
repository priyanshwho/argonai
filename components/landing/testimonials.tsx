"use client";

import { TestimonialsColumn } from "@/components/blocks/testimonials-columns-1";

export default function Testimonials() {
  const testimonials = [
    {
      text: "ARGON AI completely solved my context-switching fatigue. Having my email threads and calendar grids inside a single command panel with a private AI changed my daily routine.",
      name: "Alex Chen",
      role: "Founder @ Veloce Tech",
      image: "https://avatar.iran.liara.run/username?username=Alex+Chen"
    },
    {
      text: "The calendar slot booking assistant is magical. I type a simple chat command and it schedules invites while checking my availability in real time.",
      name: "Priya Sharma",
      role: "Product Lead @ Linear",
      image: "https://avatar.iran.liara.run/username?username=Priya+Sharma"
    },
    {
      text: "All connections are secure, and database caches are double-encrypted. ARGON AI is a secure, high-end productivity hub that I trust with my calendar metrics.",
      name: "James Wilson",
      role: "Security Director @ Atria",
      image: "https://avatar.iran.liara.run/username?username=James+Wilson"
    },
    {
      text: "The dark mode is beautiful and clean, but the light mode is equally gorgeous. Toggling themes is fast and coordinates layout colors perfectly.",
      name: "Mira Patel",
      role: "Backend Engineer @ Cloudflare",
      image: "https://avatar.iran.liara.run/username?username=Mira+Patel"
    },
    {
      text: "The email thread summarizer gives me a bullet-point snapshot of a long thread in seconds. I've cut down my inbox time by at least 40%.",
      name: "David Kim",
      role: "Growth Operations @ Stripe",
      image: "https://avatar.iran.liara.run/username?username=David+Kim"
    },
    {
      text: "Finally, a command center that actually feels like a workspace tool rather than a standard client. It's minimal, secure, and extremely powerful.",
      name: "Sophia Rodriguez",
      role: "Chief of Staff @ Mercury",
      image: "https://avatar.iran.liara.run/username?username=Sophia+Rodriguez"
    },
  ];

  // Distribute testimonials into 3 columns
  const firstColumn = [testimonials[0], testimonials[1]];
  const secondColumn = [testimonials[2], testimonials[3]];
  const thirdColumn = [testimonials[4], testimonials[5]];

  return (
    <section id="testimonials" className="py-32 md:py-40 border-t border-border bg-background text-foreground relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="text-center space-y-5 mb-20 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif text-foreground tracking-tight uppercase leading-tight">
            Testimonials
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Hear from teams streamlining their workspace operations with ARGON AI.
          </p>
        </div>

        {/* Scrolling Columns Container */}
        <div className="relative h-[650px] overflow-hidden rounded-3xl border border-border/40 bg-card/10 px-4 md:px-8 py-6">
          {/* Top and Bottom Fade Masks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center h-full">
            <TestimonialsColumn 
              testimonials={firstColumn} 
              duration={16} 
              className="w-full flex justify-center"
            />
            <TestimonialsColumn 
              testimonials={secondColumn} 
              duration={20} 
              className="hidden md:flex w-full justify-center" 
            />
            <TestimonialsColumn 
              testimonials={thirdColumn} 
              duration={14} 
              className="hidden lg:flex w-full justify-center" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}

