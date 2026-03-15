import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--sidebar-border)] bg-white/5 px-4 py-2 text-[14px] text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)] placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
