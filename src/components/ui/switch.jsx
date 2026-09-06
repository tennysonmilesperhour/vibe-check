import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn("group relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", className)}
    {...props}
    ref={ref}>
    <span aria-hidden="true" className="pointer-events-none absolute h-5 w-9 rounded-full bg-input transition-colors group-data-[state=checked]:bg-primary" />
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none absolute left-1.5 block h-4 w-4 rounded-full bg-background shadow ring-0 transition-transform group-data-[state=checked]:translate-x-4"
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
