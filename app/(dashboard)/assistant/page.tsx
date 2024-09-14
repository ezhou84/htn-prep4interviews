"use client";

import React, { useEffect } from 'react';
import AssistantFallback from '@/components/shared/assistant/AssistantFallback';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import LandingPage from '@/components/LandingPage';
type Props = React.PropsWithChildren<{}>

function AssistantPage({children}: Props) {
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
  return <AssistantFallback />
};

export default AssistantPage