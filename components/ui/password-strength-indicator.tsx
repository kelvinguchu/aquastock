import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const strength = getStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-full rounded-full transition-all duration-300",
              {
                "bg-red-500": strength > 0 && strength <= 2 && i === 0,
                "bg-yellow-500": strength > 2 && strength <= 3 && i <= 2,
                "bg-green-500": strength > 3 && i <= strength,
                "bg-gray-200": i >= strength,
              }
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {strength === 0 && "Enter a password"}
        {strength === 1 && "Too weak"}
        {strength === 2 && "Could be stronger"}
        {strength === 3 && "Getting better"}
        {strength === 4 && "Strong password"}
        {strength === 5 && "Very strong password"}
      </p>
    </div>
  );
} 