"use client";
import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "@/app/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

const spacingGapClasses = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
}

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center rounded-lg data-[size=sm]:rounded-lg data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        spacingGapClasses[spacing] ?? "gap-2",
        className
      )}
      {...props}>
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 group-data-[spacing=0]/toggle-group:shadow-none group-data-[spacing=0]/toggle-group:first:rounded-l-lg group-data-[spacing=0]/toggle-group:last:rounded-r-lg group-data-[spacing=0]/toggle-group:data-[variant=outline]:border-l-0 group-data-[spacing=0]/toggle-group:data-[variant=outline]:first:border-l",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}>
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem }
