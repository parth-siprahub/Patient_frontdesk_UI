import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IndianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  id?: string;
}

export function IndianPhoneInput({ value, onChange, error, className, id }: IndianPhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and spaces
    const input = e.target.value.replace(/[^\d\s]/g, '');
    // Limit to 10 digits (excluding spaces)
    const digitsOnly = input.replace(/\s/g, '');
    if (digitsOnly.length <= 10) {
      // Format with space after 5 digits: "98765 43210"
      let formatted = digitsOnly;
      if (digitsOnly.length > 5) {
        formatted = `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
      }
      onChange(formatted);
    }
  };

  return (
    <div className="flex">
      <div className="flex items-center gap-2 px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
        <span className="text-base">🇮🇳</span>
        <span className="font-medium">+91</span>
      </div>
      <Input
        id={id}
        type="tel"
        placeholder="98765 43210"
        value={value}
        onChange={handleChange}
        className={cn(
          "rounded-l-none",
          error && "border-destructive",
          className
        )}
      />
    </div>
  );
}

export function validateIndianPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\s/g, '');
  return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
}
