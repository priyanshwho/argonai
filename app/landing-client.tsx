"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAnimatedThemeToggle } from "@/components/ui/animated-theme-toggler";
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
import { PulseBeams } from "@/components/ui/pulse-beams";
import { WavePath } from "@/components/ui/wave-path";

const heroBeams = [
  {
    path: "M 0,100 L 220,100",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "100", y2: "100" },
      animate: { x1: ["0%", "100%"], x2: ["10%", "110%"], y1: ["100", "100"], y2: ["100", "100"] },
      transition: { duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }
    }
  },
  {
    path: "M 600,100 L 380,100",
    gradientConfig: {
      initial: { x1: "100%", x2: "100%", y1: "100", y2: "100" },
      animate: { x1: ["100%", "0%"], x2: ["90%", "-10%"], y1: ["100", "100"], y2: ["100", "100"] },
      transition: { duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }
    }
  },
  {
    path: "M 100,0 C 100,50 150,100 220,100",
    gradientConfig: {
      initial: { x1: "0%", x2: "0%", y1: "0", y2: "0" },
      animate: { x1: ["0%", "100%"], x2: ["10%", "110%"], y1: ["0", "100"], y2: ["0", "100"] },
      transition: { duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }
    }
  },
  {
    path: "M 500,200 C 500,150 450,100 380,100",
    gradientConfig: {
      initial: { x1: "100%", x2: "100%", y1: "200", y2: "200" },
      animate: { x1: ["100%", "0%"], x2: ["90%", "-10%"], y1: ["200", "100"], y2: ["200", "100"] },
      transition: { duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }
    }
  }
];

export default function LandingClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleTheme = useAnimatedThemeToggle();
  const [activeSection, setActiveSection] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  // Keep toggleTheme in a ref so it never causes the GSAP useEffect to re-run
  const toggleThemeRef = useRef(toggleTheme);
  useEffect(() => { toggleThemeRef.current = toggleTheme; }, [toggleTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    const STORAGE_KEY = "locus_preloader_last_shown";
    const lastShown = Number(localStorage.getItem(STORAGE_KEY) || "0");
    const skipPreloader = Date.now() - lastShown < COOLDOWN_MS;

    // Double-tap anywhere on the landing page to toggle theme
    let lastTap = 0;
    const handleDblTap = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTap < 350) {
        toggleThemeRef.current(e.clientX, e.clientY);
      }
      lastTap = now;
    };
    const el = containerRef.current;
    el.addEventListener("click", handleDblTap);

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

    // Split headers and footer
    const preloaderHeaderSplit = splitText(".preloader-header h1", "chars", "char");
    const headerSplit = splitText(".header h1", "chars", "char", false);

    // --- SKIP PRELOADER if within cooldown window ---
    if (skipPreloader) {
      // Immediately hide preloader and mark page loaded
      const preloaderEl = containerRef.current.querySelector(".preloader") as HTMLElement | null;
      if (preloaderEl) {
        preloaderEl.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
        preloaderEl.style.display = "none";
      }
      setIsLoaded(true);

      // Instantly reveal nav and content without the 5-second wait
      gsap.set(containerRef.current.querySelectorAll(".header h1 .char"), { y: "0%" });
      gsap.set(containerRef.current.querySelectorAll(".nav-link-container, .sign-up-btn"), { y: "0%", opacity: 1 });
      gsap.set(containerRef.current.querySelectorAll(".hero-sub"), { y: "0%", opacity: 1 });

      return () => {
        el.removeEventListener("click", handleDblTap);
        preloaderHeaderSplit.revert();
        headerSplit.revert();
      };
    }



    const preloaderImgInitRotations = [7.5, -2.5, -10, 12.5, -5, 5];

    // Set initial states for elements that don't rely on SplitText
    gsap.set(containerRef.current.querySelectorAll(".preloader-img"), {
      rotate: (i) => preloaderImgInitRotations[i] || 0,
    });
    gsap.set(containerRef.current.querySelectorAll(".nav-link-container, .sign-up-btn"), {
      y: "100%",
      opacity: 0,
    });
    gsap.set(containerRef.current.querySelectorAll(".hero-sub"), {
      y: "20px",
      opacity: 0,
    });

    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        setIsLoaded(true);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
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
      containerRef.current.querySelectorAll(".nav-link-container, .sign-up-btn"),
      {
        y: "0%",
        opacity: 1,
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

    // 10. Animate hero sub text in
    tl.to(
      containerRef.current.querySelectorAll(".hero-sub"),
      {
        y: "0%",
        opacity: 1,
        duration: 1,
        ease: "hop",
      },
      4.75
    );

    return () => {
      el.removeEventListener("click", handleDblTap);
      tl.kill();
      preloaderHeaderSplit.revert();
      headerSplit.revert();
    };
  }, []); // empty deps — toggleTheme accessed via ref, cooldown from localStorage

  useEffect(() => {
    // Scroll listener for highlighting active nav link (works forwards and backwards)
    const handleScroll = () => {
      const sections = ["features", "testimonials", "pricing", "faqs"];
      const scrollPosition = window.scrollY + window.innerHeight * 0.45;

      let currentSection = "";
      
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const wrapper = el.closest(".section-stack-wrapper") || el;
          const top = (wrapper as HTMLElement).offsetTop;
          if (scrollPosition >= top) {
            currentSection = id;
          }
        }
      }

      if (window.scrollY < 100) {
        currentSection = "";
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const wrapper = element.closest(".section-stack-wrapper") || element;
      const targetY = (wrapper as HTMLElement).offsetTop;
      window.scrollTo({
        top: targetY,
        behavior: "smooth"
      });
    }
  };

  return (
    <div ref={containerRef} className={`landing-page-container ${isLoaded ? "loaded" : ""}`}>
      {/* Preloader Overlay */}
      <div className="preloader">
        <div className="preloader-images">
          <div className="preloader-img">
            <img src="/Yuya_M (@yuyar33) on X.jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
          <div className="preloader-img">
            <img src="/Fushimi Inari.jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
          <div className="preloader-img">
            <img src="/Fushimi Inari Taisha,  Kyoto.jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
          <div className="preloader-img">
            <img src="/Fuji, Japan.jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
          <div className="preloader-img">
            <img src="/_ (4).jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
          <div className="preloader-img">
            <img src="/_ (3).jpeg" alt="" className="shadow-[0_15px_40px_rgba(0,0,0,0.6)] dark:shadow-[0_15px_40px_rgba(255,255,255,0.15)] rounded-xl" />
          </div>
        </div>

        <div className="preloader-header">
          <h1>Argon</h1>
          <div className="preloader-counter">
            <p>000</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="font-serif flex items-center justify-between w-full px-8 py-2 z-50 text-black dark:text-foreground">
        <div className="nav-logo flex items-center select-none">
          <Link href="/" className="flex items-center">
            <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-20 md:h-24 w-auto" />
            <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-20 md:h-24 w-auto" />
          </Link>
        </div>

        {/* Center scrolling links */}
        <div className="hidden md:flex items-center gap-8 text-base font-semibold text-black dark:text-muted-foreground bg-background/50 dark:bg-card/30 border border-border/10 rounded-full px-7 pt-2.5 pb-1.5 backdrop-blur-xs shadow-sm">
          <button onClick={() => scrollToSection("features")} className="cursor-pointer flex items-center relative">
            {activeSection === "features" && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
            <div className="nav-link-container">
              <span className={`nav-link-text ${activeSection === "features" ? "text-foreground" : ""}`}>Features</span>
              <span className="nav-link-text-clone">Features</span>
            </div>
          </button>
          <button onClick={() => scrollToSection("testimonials")} className="cursor-pointer flex items-center relative">
            {activeSection === "testimonials" && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
            <div className="nav-link-container">
              <span className={`nav-link-text ${activeSection === "testimonials" ? "text-foreground" : ""}`}>Testimonials</span>
              <span className="nav-link-text-clone">Testimonials</span>
            </div>
          </button>
          <button onClick={() => scrollToSection("pricing")} className="cursor-pointer flex items-center relative">
            {activeSection === "pricing" && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
            <div className="nav-link-container">
              <span className={`nav-link-text ${activeSection === "pricing" ? "text-foreground" : ""}`}>Pricing</span>
              <span className="nav-link-text-clone">Pricing</span>
            </div>
          </button>
          <button onClick={() => scrollToSection("faqs")} className="cursor-pointer flex items-center relative">
            {activeSection === "faqs" && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
            <div className="nav-link-container">
              <span className={`nav-link-text ${activeSection === "faqs" ? "text-foreground" : ""}`}>FAQs</span>
              <span className="nav-link-text-clone">FAQs</span>
            </div>
          </button>
        </div>

        <div className="nav-links flex items-center gap-6">
          <Link href="/sign-in" className="text-base font-medium">
            <div className="relative inline-block overflow-hidden group" style={{ height: "1.3em", verticalAlign: "middle" }}>
              <span className="block transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full" style={{ lineHeight: "1.3em" }}>Sign In</span>
              <span className="absolute top-0 left-0 w-full h-full flex items-center translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0" style={{ color: "var(--base-accent)", lineHeight: "1.3em" }}>Sign In</span>
            </div>
          </Link>
          <Link href="/sign-up" className="inline-flex h-9 items-center justify-center px-7 text-xs uppercase tracking-wider font-serif sign-up-btn">
            Sign Up <span className="inline-block ml-1">✦</span>
          </Link>
        </div>
      </nav>

      {/* Main Hero */}
      <section className="hero">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-no-repeat bg-cover opacity-[0.3] dark:opacity-[1] pointer-events-none blur-md dark:blur-none"
          style={{ 
            backgroundImage: "url('/HERO-BGMM.png')",
            backgroundPosition: "35% center",
          }}
        />

        {/* Image Trail Layer (rendered behind text inside the hero section, stacking above z-1 overlay) */}
        <div className="absolute inset-0 z-2 pointer-events-none">
          <ImageTrail containerRef={containerRef as any}>
            <img
              src="/Yuya_M (@yuyar33) on X.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
            <img
              src="/Fushimi Inari.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
            <img
              src="/Fushimi Inari Taisha,  Kyoto.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
            <img
              src="/Fuji, Japan.jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
            <img
              src="/_ (4).jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
            <img
              src="/_ (3).jpeg"
              alt=""
              className="w-[50px] h-[60px] object-cover rounded-md border border-[#e0e2db]/20 shadow-[0_15px_35px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.15)] dark:border-[#141414]/20"
            />
          </ImageTrail>
        </div>

        {/* 3. Welcome label + Main Header */}
        <div className="header z-10">
          <span className="welcome-label text-xs md:text-sm uppercase tracking-[0.3em] text-foreground/60 mb-2 select-none block">Welcome to</span>
          <Link href="/sign-in" className="cursor-pointer">
            <h1>ARGON AI</h1>
          </Link>
        </div>

        {/* 4. Subhero description */}
        <div className="hero-sub z-10 mt-3">
          <p className="subhero-text text-foreground/90 max-w-3xl leading-relaxed select-none">
            AI That Doesn&apos;t Just <span className="italic font-bold text-primary">Answer.</span>
            <br />
            It <span className="italic font-bold text-primary">Acts.</span>
          </p>
          <div className="w-full max-w-[600px] h-[150px] flex items-center justify-center relative">
            <PulseBeams
              beams={heroBeams}
              width={600}
              height={200}
              baseColor="rgba(196, 30, 58, 0.12)"
              accentColor="rgba(196, 30, 58, 0.3)"
              gradientColors={{
                start: "#c41e3a",
                middle: "#ff4d6d",
                end: "#c41e3a",
              }}
              className="w-full h-full"
            >
              <Link href="/sign-up" className="get-started-btn inline-flex items-center justify-center select-none z-20">
                ✦ &nbsp; Get Started
              </Link>
            </PulseBeams>
          </div>
        </div>
      </section>

      {/* Additional Page Sections — sticky stacking scroll */}
      <div className="section-stack-wrapper" style={{ zIndex: 2 }}>
        <Features />
      </div>
      <div className="section-stack-wrapper" style={{ zIndex: 3 }}>
        <Testimonials />
      </div>
      <div className="section-stack-wrapper" style={{ zIndex: 4 }}>
        <Pricing />
      </div>
      <div className="section-stack-wrapper" style={{ zIndex: 5 }}>
        <FAQs />
      </div>
      <div className="section-stack-wrapper" style={{ zIndex: 6 }}>
        <CTA />
      </div>
      <div className="section-stack-wrapper bg-background" style={{ zIndex: 7 }}>
        <div className="w-full bg-background text-foreground/30 hover:text-primary transition-colors duration-300 relative">
          <WavePath className="w-full" />
        </div>
        <Footer />
      </div>
    </div>
  );
}
