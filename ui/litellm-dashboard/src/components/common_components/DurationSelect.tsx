import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { t } from "@/i18n";
interface DurationSelectProps {
  className?: string;
  value?: string;
  onChange?: (value: string, option: { value: string; label: string }) => void;
}

const DURATION_OPTIONS = [
  { value: "24h", label: t("Daily")},
  { value: "7d", label: t("Weekly")},
  { value: "30d", label: t("Monthly")},
];

export default function DurationSelect({ className, value, onChange }: DurationSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        const selectedOption = DURATION_OPTIONS.find((option) => option.value === nextValue);
        if (selectedOption) {
          onChange?.(selectedOption.value, selectedOption);
        }
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={t("Select duration")} />
      </SelectTrigger>
      <SelectContent>
        {DURATION_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
