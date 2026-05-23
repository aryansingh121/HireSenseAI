export default function ScoreRing({ label, value, color = "#0f766e", size = 88 }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex min-w-20 flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 88 88" role="img" aria-label={`${label} ${value}`}>
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="9"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="49"
          textAnchor="middle"
          className="fill-ink text-lg font-bold"
        >
          {value}
        </text>
      </svg>
      <span className="text-center text-xs font-semibold text-slate-500">{label}</span>
    </div>
  );
}
