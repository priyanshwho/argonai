"use client";

import dynamic from "next/dynamic";

const LandingClient = dynamic(() => import("./landing-client"), {
  ssr: false,
});

export default function LandingWrapper() {
  return <LandingClient />;
}
