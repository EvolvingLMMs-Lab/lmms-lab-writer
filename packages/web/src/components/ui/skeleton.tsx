import React from 'react'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-neutral-200 ${className ?? ''}`}
    />
  )
}

export function DocumentSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border border-border p-4 space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
