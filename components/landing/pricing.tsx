"use client";

import { CreativePricing, PricingTier } from "@/components/ui/creative-pricing";
import { CreditCardHero } from "@/components/ui/credit-card-hero";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function Pricing() {
  const plans: PricingTier[] = [
    {
      name: "Free Tier",
      price: "₹0",
      description: "Perfect for casual users",
      features: [
        "Basic Gmail & Calendar Sync",
        "Standard AI Assistant Chat",
        "Weekly sync monitoring logs",
        "Double-envelope KEK security",
      ],
      ctaText: "Get Started",
      popular: false,
      color: "zinc",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      name: "Pro Plan",
      price: "₹299",
      description: "For busy professionals",
      features: [
        "Everything in the Free Tier",
        "Real-time webhook sync updates",
        "AI email response drafting",
        "Interactive calendar booking",
        "Priority sync processing",
      ],
      ctaText: "Start Pro Trial",
      popular: true,
      color: "red",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      description: "For organizations and teams",
      features: [
        "Everything in the Pro Plan",
        "Custom database hosting config",
        "Dedicated server sync channels",
        "SLA sync guarantees",
        "Custom security compliance checks",
      ],
      ctaText: "Contact Sales",
      popular: false,
      color: "zinc",
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ];

  return (
    <section id="pricing" className="py-32 md:py-40 border-t border-border bg-background text-foreground relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Credit Card Hero Hover Visual */}
        <div className="mb-28 flex justify-center">
          <CreditCardHero
            headline="Zero-Knowledge Secure Billing"
            subtext="All sync credentials and database secrets are encrypted locally. Upgrade securely to experience the premium features of ARGON AI."
            cta="Explore Plans Below"
            onCtaClick={() => document.getElementById("plans-comparison-anchor")?.scrollIntoView({ behavior: "smooth" })}
            primaryCardImage="/argon_black_card.png"
            secondaryCardImage="/argon_crimson_card.png"
            className="w-full max-w-4xl border border-border/60 bg-card/35 backdrop-blur-[8px] rounded-3xl"
          />
        </div>

        <div id="plans-comparison-anchor" className="scroll-mt-32">
          <CreativePricing
            tag="Premium Billing Options"
            title="Simple Pricing. Clear Value."
            description="Choose the plan that suits your email and calendar workflow."
            tiers={plans}
          />
        </div>

      </div>
    </section>
  );
}
