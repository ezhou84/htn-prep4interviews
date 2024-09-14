"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/assistant");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return null;
}
