"use client"

import SidebarWrapper from '@/components/shared/sidebar/SidebarWrapper'
import { AuthLoading } from 'convex/react'
import LoadingLogo from '@/components/shared/LoadingLogo'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'
import { useUser } from '@clerk/nextjs'

type Props = React.PropsWithChildren<{}>

const Layout = ({ children }: Props) => {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, isLoaded, router]);
  return (
    <>
      <LoadingLogo />
      <main className="h-full w-full pt-3 m-0 bg-blue-500 dark:bg-slate-950">
        <SidebarWrapper>{children}</SidebarWrapper>
      </main>
    </>
  )
}

export default Layout