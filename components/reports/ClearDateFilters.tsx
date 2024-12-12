import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClearDateFiltersProps {
  onClear: () => void;
  show: boolean;
}

export function ClearDateFilters({ onClear, show }: ClearDateFiltersProps) {
  if (!show) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClear}
      className="h-8"
    >
      Clear Filters
      <X className="ml-2 h-4 w-4" />
    </Button>
  );
} 