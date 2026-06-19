import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
    name: string;
    icon: React.ReactNode;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
    color: string;
    ctaText?: string;
}

function CreativePricing({
    tag = "Simple Pricing",
    title = "Simple Pricing. Clear Value.",
    description = "Choose the plan that suits your email and calendar workflow.",
    tiers,
}: {
    tag?: string;
    title?: string;
    description?: string;
    tiers: PricingTier[];
}) {
    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="text-center space-y-5 mb-20">
                <div className="font-mono text-sm tracking-wider uppercase text-primary rotate-[-1deg]">
                    {tag}
                </div>
                <div className="relative">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif text-foreground rotate-[-1deg] uppercase leading-tight tracking-tight">
                        {title}
                    </h2>
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-primary/20 
                        rotate-[-1deg] rounded-full blur-sm"
                    />
                </div>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed rotate-[-1deg]">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier, index) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-300",
                            index === 0 && "rotate-[-1deg]",
                            index === 1 && "rotate-[1deg]",
                            index === 2 && "rotate-[-2deg]"
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-0 bg-card/65 dark:bg-card/45 backdrop-blur-[5px]",
                                "border-2 border-border group-hover:border-primary/50",
                                "rounded-2xl shadow-[6px_6px_0px_0px] shadow-primary/10 dark:shadow-primary/5",
                                "transition-all duration-300",
                                "group-hover:shadow-[10px_10px_0px_0px] group-hover:shadow-primary/20 dark:group-hover:shadow-primary/10",
                                "group-hover:translate-x-[-4px]",
                                "group-hover:translate-y-[-4px]"
                            )}
                        />

                        <div className="relative p-8 md:p-10 flex flex-col justify-between h-full min-h-[460px]">
                            {tier.popular && (
                                <div
                                    className="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground 
                                    font-mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-full rotate-12 border-2 border-border shadow-sm"
                                >
                                    Recommended
                                </div>
                            )}

                            <div>
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-serif text-2xl font-bold uppercase text-foreground tracking-wide">
                                            {tier.name}
                                        </h3>
                                        <p className="font-sans text-sm text-muted-foreground mt-1">
                                            {tier.description}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border border-border shadow-inner text-primary",
                                            tier.popular ? "bg-primary/10 border-primary/20" : "bg-secondary/20"
                                        )}
                                    >
                                        {tier.icon}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-8 flex items-baseline">
                                    <span className="text-4xl md:text-5xl font-extrabold text-foreground font-serif tracking-tight">
                                        {tier.price}
                                    </span>
                                    {tier.price !== "Contact Us" && (
                                        <span className="text-muted-foreground font-mono text-sm ml-1.5">
                                            {tier.price.includes("forever") ? "" : "/month"}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 mb-8">
                                    {tier.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-start gap-3"
                                        >
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                                                    tier.popular ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                                                )}
                                            >
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="font-sans text-base text-foreground/90 leading-snug">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-12 font-mono uppercase tracking-wider text-sm font-bold rounded-full relative transition-all duration-300",
                                    tier.popular
                                        ? [
                                              "bg-primary text-primary-foreground hover:bg-primary/95",
                                              "shadow-[4px_4px_0px_0px] shadow-primary-foreground/10",
                                              "hover:translate-x-[-1px] hover:translate-y-[-1px]",
                                          ]
                                        : [
                                              "bg-background text-foreground border border-border hover:bg-muted",
                                              "shadow-sm",
                                          ]
                                )}
                            >
                                {tier.ctaText || "Get Started"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export { CreativePricing };
export type { PricingTier };