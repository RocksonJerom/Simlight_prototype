import type { ReactNode } from 'react'

/** Consistent full-width page shell for desktop-friendly layouts. */
export function PageContainer({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'main' | 'section'
}) {
  return (
    <Tag className={`w-full max-w-[min(100%,90rem)] mx-auto px-4 sm:px-6 lg:px-10 ${className}`}>
      {children}
    </Tag>
  )
}
