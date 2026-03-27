import React, { useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * MobileSelect: Radix UI Select that shows as bottom sheet on mobile (<640px).
 * On desktop, renders native Radix Select. Props match Radix UI Select component.
 */
export default function MobileSelect({
  value,
  onValueChange,
  children,
  placeholder = "Seleccionar...",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSelect = useCallback(
    (val) => {
      onValueChange(val);
      setOpen(false);
    },
    [onValueChange]
  );

  // Mobile: bottom sheet with manual item selection
  if (isMobile) {
    const selectedChild = React.Children.toArray(children).find(
      (child) => child.props.value === value
    );
    const selectedLabel = selectedChild?.props.children || placeholder;

    return (
      <>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className={`w-full justify-between h-9 ${className}`}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {selectedLabel}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="z-[110]">
            <DrawerHeader>
              <DrawerTitle>{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-2 overflow-y-auto max-h-[60vh]">
              {React.Children.toArray(children).map((child) => (
                <button
                  key={child.props.value}
                  onClick={() => handleSelect(child.props.value)}
                  className={`w-full p-3 rounded-lg border-2 text-left font-medium transition-all ${
                    value === child.props.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30 text-foreground"
                  }`}
                >
                  {child.props.children}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: standard Radix Select — map <option> children to <SelectItem>
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {React.Children.toArray(children)
          .filter((child) => child?.props?.value !== undefined && child?.props?.value !== "")
          .map((child) => (
            <SelectItem key={child.props.value} value={child.props.value}>
              {child.props.children}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}