"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free Tier",
      price: "₹0",
      period: "/forever",
      tagline: "Perfect for casual coders",
      features: [
        "Try daily challenges",
        "Explore a few problem sets",
        "Community solutions",
        "Basic progress tracking",
        "Public leaderboards",
        "Get a feel for the platform",
      ],
      cta: "Start Training",
      popular: false,
    },
    {
      name: "Pro Plan",
      price: "₹299",
      period: "/month",
      tagline: "For the serious interview prepper",
      features: [
        "Everything in the Free Tier",
        "Full problem vault",
        "Mock interviews",
        "Smart tracking and insights",
        "Resume reviews",
      ],
      cta: "Become a Vigilante",
      popular: true,
    },
    {
      name: "\"Bat Signal\" Plan",
      price: "Contact Us",
      period: "",
      tagline: "For institutions and enterprise",
      features: [
        "Everything in the Pro Plan",
        "Custom training & advanced analytics",
        "Early access to new features",
        "VIP Discord access",
        "Guaranteed feedback on solutions",
      ],
      cta: "Signal Alfred",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 border-t border-zinc-900 bg-zinc-950 text-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-bold font-serif text-white tracking-tight sm:text-4xl uppercase">
            Simple Pricing. No Riddles.
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Whether you're testing the waters or going full vigilante, we've got a plan.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl border flex flex-col p-8 relative overflow-hidden transition-all ${
                plan.popular
                  ? "border-[#f59e0b] bg-zinc-900/40 shadow-xl shadow-[#f59e0b]/5 scale-105 md:scale-105"
                  : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#f59e0b] text-zinc-950 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-lg font-mono">
                  User's Choice
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-400 uppercase font-mono tracking-wider">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight text-white font-serif">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-sm text-zinc-500 font-mono">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 font-mono italic">
                  {plan.tagline}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? "text-[#f59e0b]" : "text-zinc-500"}`} />
                    <span className="text-sm text-zinc-300 font-sans leading-tight">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/sign-up"
                className={`w-full flex h-11 items-center justify-center rounded-full text-xs font-bold uppercase tracking-wider font-mono transition-all active:scale-95 ${
                  plan.popular
                    ? "bg-[#f59e0b] text-zinc-950 hover:bg-[#d97706]"
                    : "border border-zinc-800 text-white bg-zinc-950/40 hover:bg-zinc-900"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
