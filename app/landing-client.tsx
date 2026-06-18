"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ImageTrail } from "@/components/ui/image-trail";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Features from "@/components/landing/features";
import Testimonials from "@/components/landing/testimonials";
import Pricing from "@/components/landing/pricing";
import FAQs from "@/components/landing/faqs";
import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

export default function LandingClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Register GSAP plugins
    gsap.registerPlugin(CustomEase, SplitText);

    CustomEase.create("hop", "0.8, 0, 0.2, 1");
    CustomEase.create("hop2", "0.9, 0, 0.1, 1");

    // Split text helper matching the user's modifications
    const splitText = (selector: string, type: "chars" | "words", className: string, mask = true) => {
      return SplitText.create(selector, {
        type: type,
        [`${type}Class`]: className,
        ...(mask && { mask: type }),
      });
    };

    // Split headers, footer, and navigation links
    const preloaderHeaderSplit = splitText(".preloader-header h1", "chars", "char");
    const navSplit = splitText("nav a", "words", "word");
    const headerSplit = splitText(".header h1", "chars", "char", false);
    const footerSplit = splitText(".hero-footer p", "words", "word");

    const preloaderImgInitRotations = [7.5, -2.5, -10, 12.5, -5, 5];

    // Set initial image rotations
    gsap.set(containerRef.current.querySelectorAll(".preloader-img"), {
      rotate: (i) => preloaderImgInitRotations[i] || 0,
    });

    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        if (containerRef.current) {
          containerRef.current.classList.add("loaded");
        }
      }
    });

    // 1. Scale and rotate preloader images in
    tl.to(containerRef.current.querySelectorAll(".preloader-img"), {
      scale: 1,
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "hop",
      stagger: 0.2,
    });

    // 2. Animate preloader h1 characters up
    tl.to(
      containerRef.current.querySelectorAll(".preloader-header h1 .char"),
      {
        y: "0%",
        duration: 1,
        ease: "hop2",
        stagger: {
          each: 0.125,
          from: "random",
        },
      },
      "0.35"
    );

    // 3. Slide counter text up and run timer
    tl.to(
      containerRef.current.querySelector(".preloader-counter p"),
      {
        y: "0%",
        duration: 1,
        ease: "hop2",
        onStart: () => {
          const counterEl = containerRef.current?.querySelector(".preloader-counter p");
          if (!counterEl) return;

          const counter = { value: 0 };
          gsap.to(counter, {
            value: 100,
            duration: 2,
            delay: 0.5,
            ease: "power2.inOut",
            onUpdate: () => {
              counterEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
            },
          });
        },
      },
      "<"
    );

    // 4. Slide counter out
    tl.to(
      containerRef.current.querySelector(".preloader-counter p"),
      {
        y: "-100%",
        duration: 0.75,
        ease: "hop2",
      },
      3.25
    );

    // 5. Slide preloader h1 characters out
    tl.to(
      containerRef.current.querySelectorAll(".preloader-header h1 .char"),
      {
        y: "-100%",
        duration: 0.75,
        ease: "hop2",
        stagger: {
          each: 0.125,
          from: "random",
        },
      },
      3.25
    );

    // 6. Shrink and clip preloader images
    tl.to(
      containerRef.current.querySelectorAll(".preloader-images .preloader-img"),
      {
        scale: 0,
        clipPath: "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)",
        duration: 1,
        ease: "hop2",
        stagger: -0.075,
      },
      3.5
    );

    // 7. Slide preloader wrapper container out
    tl.to(
      containerRef.current.querySelector(".preloader"),
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        duration: 1,
        ease: "hop2",
      },
      4.35
    );

    // 8. Animate main landing title text characters up
    tl.to(
      containerRef.current.querySelectorAll(".header h1 .char"),
      {
        y: "0%",
        duration: 1,
        ease: "hop",
        stagger: {
          each: 0.075,
          from: "random",
        },
      },
      4.65
    );

    // 9. Animate navbar links in
    tl.to(
      containerRef.current.querySelectorAll("nav a .word"),
      {
        y: "0%",
        duration: 1,
        ease: "hop",
        stagger: 0.075,
      },
      4.75
    );

    // 9.5. Animate navbar toggle in
    tl.to(
      containerRef.current.querySelectorAll(".nav-toggle-fade"),
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "hop",
      },
      "<"
    );

    // 10. Animate footer text in
    tl.to(
      containerRef.current.querySelectorAll(".hero-footer p .word"),
      {
        y: "0%",
        duration: 1,
        ease: "hop",
        stagger: 0.075,
      },
      4.75
    );

    return () => {
      tl.kill();
      preloaderHeaderSplit.revert();
      navSplit.revert();
      headerSplit.revert();
      footerSplit.revert();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div ref={containerRef} className="landing-page-container">
      {/* Preloader Overlay */}
      <div className="preloader">
        <div className="preloader-images">
          <div className="preloader-img">
            <img src="/Yuya_M (@yuyar33) on X.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Fushimi Inari.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Fushimi Inari Taisha,  Kyoto.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Fuji, Japan.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/_ (4).jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/_ (3).jpeg" alt="" />
          </div>
        </div>

        <div className="preloader-header">
          <h1>Locus</h1>
          <div className="preloader-counter">
            <p>000</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between w-full px-8 py-6 z-50">
        <div className="nav-logo">
          <Link href="/">Locus</Link>
        </div>

        {/* Center scrolling links */}
        <div className="hidden md:flex items-center gap-8 text-base font-semibold text-muted-foreground bg-background/50 dark:bg-card/30 border border-border/10 rounded-full px-7 py-2.5 backdrop-blur-xs shadow-sm">
          <button onClick={() => scrollToSection("features")} className="cursor-pointer hover:text-primary transition-colors">Features</button>
          <button onClick={() => scrollToSection("testimonials")} className="cursor-pointer hover:text-primary transition-colors">Testimonials</button>
          <button onClick={() => scrollToSection("pricing")} className="cursor-pointer hover:text-primary transition-colors">Pricing</button>
          <button onClick={() => scrollToSection("faqs")} className="cursor-pointer hover:text-primary transition-colors">FAQs</button>
        </div>

        <div className="nav-links flex items-center gap-6">
          <Link href="/sign-in" className="hover:text-primary transition-colors text-base font-medium">Sign In</Link>
          <Link href="/sign-up" className="flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors uppercase tracking-wider font-mono">Sign Up ✦</Link>
          <div className="nav-toggle-fade flex items-center justify-center">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <section className="hero">
        {/* Image Trail Layer (rendered behind text inside the hero section, stacking above z-1 overlay) */}
        <div className="absolute inset-0 z-2 pointer-events-none">
          <ImageTrail containerRef={containerRef as any}>
            <img
              src="/Yuya_M (@yuyar33) on X.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
            <img
              src="/Fushimi Inari.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
            <img
              src="/Fushimi Inari Taisha,  Kyoto.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
            <img
              src="/Fuji, Japan.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
            <img
              src="/_ (4).jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
            <img
              src="/_ (3).jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
            />
          </ImageTrail>
        </div>

        <div className="header">
          <Link href="/sign-in" className="cursor-pointer">
            <h1>Locus</h1>
          </Link>
        </div>

        <div className="hero-footer">
          <Link href="/sign-in" className="cursor-pointer">
            <p>Inbox</p>
          </Link>
          <Link href="/sign-in" className="cursor-pointer">
            <p>Calendar</p>
          </Link>
          <Link href="/sign-in" className="cursor-pointer">
            <p>Intelligence</p>
          </Link>
        </div>
      </section>

      {/* Additional Page Sections */}
      <Features />
      <Testimonials />
      <Pricing />
      <FAQs />
      <CTA />
      <Footer />
    </div>
  );
}
