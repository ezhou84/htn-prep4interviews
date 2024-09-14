"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <SignIn
        path="/signin"
        routing="path"
        signUpUrl="/signup"
        appearance={{
          layout: {
            logoPlacement: "none",
            socialButtonsPlacement: "bottom",
          },
        }}
      />
    </div>
  );
}
