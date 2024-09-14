"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
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
