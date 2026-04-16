export type PriceMode = 'hourly' | 'weekly' | 'monthly';

interface PriceToggleProps {
  value: PriceMode;
  onChange: (mode: PriceMode) => void;
}

const modes: { value: PriceMode; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const PriceToggle = ({ value, onChange }: PriceToggleProps) => (
  <div className="inline-flex rounded-lg bg-muted p-1 gap-0.5">
    {modes.map((m) => (
      <button
        key={m.value}
        onClick={() => onChange(m.value)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          value === m.value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {m.label}
      </button>
    ))}
  </div>
);
