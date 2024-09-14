"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const { theme, systemTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  useEffect(() => {
    const resolvedTheme = theme === "system" ? systemTheme : theme;
    setCurrentTheme(resolvedTheme);
  }, [theme, systemTheme]);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${
        currentTheme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/signin"
        appearance={{
          layout: {
            logoPlacement: "none",
          },
        }}
      />
    </div>
  );
}
