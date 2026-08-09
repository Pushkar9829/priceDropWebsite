export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  labelOn = 'On',
  labelOff = 'Off',
  'aria-label': ariaLabel,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (checked ? labelOn : labelOff)}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex items-center gap-2 rounded-sm px-1 py-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        disabled ? '' : 'hover:opacity-90'
      }`}
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-teal' : 'bg-ink-faint/50'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="text-sm font-medium text-ink-muted">
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}
