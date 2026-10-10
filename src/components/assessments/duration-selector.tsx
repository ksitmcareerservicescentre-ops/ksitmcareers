"use client";

interface DurationSelectorProps {
  value: number; // in minutes
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

const PRESET_DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export function DurationSelector({
  value,
  onChange,
  disabled = false,
}: DurationSelectorProps) {
  const isPreset = PRESET_DURATIONS.includes(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
          <i className="fas fa-clock text-orange-400" />
          <span>Duration / Time Limit:</span>
        </label>
        <span className="font-mono text-xs font-bold text-orange-400">
          {value} {value === 1 ? "minute" : "minutes"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_DURATIONS.map((dur) => {
          const active = value === dur;
          return (
            <button
              key={dur}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dur)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                active
                  ? "bg-orange-500 text-[#090915] shadow-md shadow-orange-500/25 ring-1 ring-orange-400"
                  : "border border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
              } disabled:opacity-50`}
            >
              {dur}m
            </button>
          );
        })}

        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-[11px] text-gray-500">Custom:</span>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={300}
              disabled={disabled}
              value={value}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
                  onChange(parsed);
                }
              }}
              className="w-16 rounded-lg border border-white/10 bg-[#090918] px-2 py-1 text-center font-mono text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
              min
            </span>
          </div>
        </div>
      </div>
      {!isPreset && (
        <p className="text-[11px] text-orange-400/80">
          Custom timer configured: {value} minutes total allotted time.
        </p>
      )}
    </div>
  );
}
