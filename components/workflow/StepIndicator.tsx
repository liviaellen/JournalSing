'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {steps.map((step) => {
          const isComplete = step.id < currentStep
          const isActive = step.id === currentStep

          return (
            <div key={step.id} className="relative flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-colors',
                  isComplete
                    ? 'bg-primary border-primary'
                    : isActive
                    ? 'bg-background border-primary'
                    : 'bg-background border-muted'
                )}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isComplete ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </motion.div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-4">
          {steps.map((step) => {
            const isComplete = step.id < currentStep
            const isActive = step.id === currentStep

            return (
              <div
                key={step.id}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  isComplete
                    ? 'bg-primary'
                    : isActive
                    ? 'bg-primary/50'
                    : 'bg-muted'
                )}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
      </div>
    </div>
  )
}
