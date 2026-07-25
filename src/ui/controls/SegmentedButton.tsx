interface SegmentedButtonProps<T extends string | number> {
  value: T;
  current: T;
  onSelect: (value: T) => void;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export function SegmentedButton<T extends string | number>({
  value,
  current,
  onSelect,
  children,
  disabled = false,
  ariaLabel,
}: SegmentedButtonProps<T>) {
  return (
    <button
      type="button"
      className="segment"
      data-active={value === current}
      aria-pressed={value === current}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}
