"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ImageTrail } from "@/components/ui/image-trail";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

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

  return (
    <div ref={containerRef} className="landing-page-container">
      {/* Image Trail Layer (rendered behind text) */}
      <div className="absolute inset-0 z-1 pointer-events-none">
        <ImageTrail containerRef={containerRef as any}>
          <img
            src="/_.jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
          <img
            src="/Nature's Simplicity_ A Two-Tone Ode to Beauty.jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
          <img
            src="/Silent Mystic Haven.jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
          <img
            src="/Wallpaper programmer.jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
          <img
            src="/_ (1).jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
          <img
            src="/_ (2).jpeg"
            alt=""
            className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-xl dark:border-[#141414]/20"
          />
        </ImageTrail>
      </div>

      {/* Preloader Overlay */}
      <div className="preloader">
        <div className="preloader-images">
          <div className="preloader-img">
            <img src="/_.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Nature's Simplicity_ A Two-Tone Ode to Beauty.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Silent Mystic Haven.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/Wallpaper programmer.jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/_ (1).jpeg" alt="" />
          </div>
          <div className="preloader-img">
            <img src="/_ (2).jpeg" alt="" />
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
      <nav>
        <div className="nav-logo">
          <Link href="/">Locus</Link>
        </div>

        <div className="nav-links flex items-center gap-6">
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
          <div className="nav-toggle-fade flex items-center justify-center">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <section className="hero">
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
    </div>
  );
}
