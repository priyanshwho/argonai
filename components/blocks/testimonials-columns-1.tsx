"use client";
import React from "react";
import { motion } from "motion/react";

export interface TestimonialItem {
  text: string;
  name: string;
  role: string;
  image: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-8 rounded-3xl border border-border bg-card/40 shadow-lg shadow-primary/5 max-w-xs w-full backdrop-blur-sm hover:border-primary/20 transition-all hover:bg-card/75" key={i}>
                  <div className="text-foreground/95 text-sm md:text-base leading-relaxed font-sans">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full bg-muted object-cover border border-border"
                    />
                    <div className="flex flex-col">
                      <div className="font-bold tracking-tight leading-5 text-sm font-serif uppercase text-foreground">{name}</div>
                      <div className="leading-5 text-xs text-muted-foreground font-mono">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};