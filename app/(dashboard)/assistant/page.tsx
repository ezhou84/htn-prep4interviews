"use client";

import React from 'react';
import AssistantFallback from '@/components/shared/assistant/AssistantFallback';
import { useRouter } from 'next/navigation';

type Props = React.PropsWithChildren<{}>

function AssistantPage({children}: Props) {
  const router = useRouter();
  return <AssistantFallback />
};

export default AssistantPage