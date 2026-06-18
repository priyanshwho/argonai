"use client";

import { Quote } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "Arkham Labs transformed my approach to technical interviews. The realistic practice environment and curated challenges made all the difference.",
      author: "Alex Chen",
      role: "Software Engineer @ Google",
    },
    {
      quote:
        "Training like the League of Shadows is no joke. Three months with Arkham Labs and I walked into my Meta interview with absolute confidence.",
      author: "Priya Sharma",
      role: "Senior Developer @ Meta",
    },
    {
      quote:
        "The progress tracking helped me identify my weak spots immediately. Within weeks, I turned those weaknesses into strengths and aced my interviews.",
      author: "James Wilson",
      role: "Tech Lead @ Amazon",
    },
    {
      quote:
        "The dark-themed practice sessions really do mimic the pressure of interviews. When the real thing came, it felt like just another night in Gotham.",
      author: "Mira Patel",
      role: "Backend Engineer @ Netflix",
    },
    {
      quote:
        "I tried multiple interview prep platforms, but Arkham Labs was the only one that felt like real training rather than endless tutorials.",
      author: "David Kim",
      role: "Software Developer @ Microsoft",
    },
    {
      quote:
        "From imposter syndrome to tech lead in six months. Arkham Labs didn't just prepare me for interviews—it transformed my entire approach to problem-solving.",
      author: "Sophia Rodriguez",
      role: "Full Stack Developer @ Stripe",
    },
    {
      quote:
        "The personalized challenge sequence pushed my limits in exactly the right ways. I'm solving problems now that I couldn't even understand before.",
      author: "Raj Patel",
      role: "Infrastructure Engineer @ Cloudflare",
    },
    {
      quote:
        "For high-frequency trading interviews, you need precision and speed. Arkham Labs honed both until my solutions were practically muscle memory.",
      author: "Emma Johnson",
      role: "Algorithm Specialist @ Trading Firm",
    },
    {
      quote:
        "The bat-signal went up, and Arkham Labs answered. I went from rejected by Apple twice to accepting an offer with a 40% higher salary than expected.",
      author: "Marcus Williams",
      role: "Security Engineer @ Apple",
    },
    {
      quote:
        "Even for AI specialists, the fundamentals matter. Arkham Labs helped me shore up my core skills while letting me focus on my machine learning expertise.",
      author: "Leila Nguyen",
      role: "ML Engineer @ Anthropic",
    },
  ];

  return (
    <section id="testimonials" className="py-20 border-t border-zinc-900 bg-zinc-950 text-white relative">
      {/* Glow effect */}
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-bold font-serif text-white tracking-tight sm:text-4xl uppercase">
            Testimonials
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-mono">
            Trained in Silence. Praised in Interviews.
          </p>
        </div>

        {/* Masonry-like Responsive Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 [column-fill:_balance] box-border">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="break-inside-avoid rounded-2xl border border-zinc-900 bg-zinc-900/10 p-8 hover:border-amber-500/20 transition-all hover:bg-zinc-900/30 flex flex-col gap-6 shadow-md"
            >
              <div className="text-amber-500/40 w-fit">
                <Quote className="h-8 w-8 fill-current" />
              </div>
              
              <blockquote className="text-sm text-zinc-300 leading-relaxed font-sans italic">
                "{item.quote}"
              </blockquote>

              <div className="border-t border-zinc-900 pt-4 flex flex-col">
                <span className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  {item.author}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {item.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
