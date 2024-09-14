"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react";
import { Bot, Users } from 'lucide-react';

export const useNavigation = () => {
  const pathname = usePathname();
  const paths = useMemo(() => [
    {
      name: "Assistant",
      href: "/assistant",
      icon: <Bot />,
      active: pathname.startsWith("/assistant")
    },
    {
      name: "Community",
      href: "/community",
      icon: <Users />,
      active: pathname.startsWith("/community")
    }
  ], [pathname]);

  return paths;
}