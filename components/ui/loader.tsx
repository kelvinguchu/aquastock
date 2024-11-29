import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'primary';
  fullHeight?: boolean;
}

export function Loader({ 
  className, 
  size = 'default', 
  variant = 'default',
  fullHeight = true
}: LoaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-center w-full",
      fullHeight ? "min-h-[inherit] h-full" : "min-h-[100px]",
      className
    )}>
      <div
        className={cn(
          "animate-spin rounded-full border-t-transparent",
          {
            // Sizes
            "h-4 w-4 border-2": size === "sm",
            "h-8 w-8 border-4": size === "default",
            "h-12 w-12 border-4": size === "lg",
            // Variants
            "border-muted-foreground/20 border-t-muted-foreground": variant === "default",
            "border-primary/20 border-t-primary": variant === "primary",
          }
        )}
      />
    </div>
  );
} 