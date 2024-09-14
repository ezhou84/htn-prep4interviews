"use client"

import SidebarWrapper from '@/components/shared/sidebar/SidebarWrapper'
import { AuthLoading } from 'convex/react'
import LoadingLogo from '@/components/shared/LoadingLogo'
import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

type Props = React.PropsWithChildren<{}>

const Layout = ({ children }: Props) => {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);
  return (
    <>
      <main className="h-full w-full pt-3 m-0 bg-blue-500 dark:bg-slate-950">
        <SidebarWrapper>{children}</SidebarWrapper>
      </main>
    </>
  )
}

export default Layout