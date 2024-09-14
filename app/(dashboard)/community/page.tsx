"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ItemList from '@/components/shared/item-list/ItemList';
import AssistantFallback from '@/components/shared/assistant/AssistantFallback';

type Props = {}

function CommunityPage(props: Props) {
  const router = useRouter();

  return (
    <>
      <ItemList title="Community">
        Community Page
      </ItemList>
      <AssistantFallback />
    </>
  )
}

export default CommunityPage
