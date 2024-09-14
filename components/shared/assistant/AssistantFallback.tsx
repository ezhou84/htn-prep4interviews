import { Card } from '@/components/ui/card'
import React from 'react'
import AssistantContainer from './AssistantContainer'

const AssistantFallback = () => {
  return (
    <Card className="hidden lg:flex h-full w-full p-2 items-center justify-center bg-secondary text-secondary-foreground">
        Content appears here when you begin the interview!
    </Card>
  )
}

export default AssistantFallback