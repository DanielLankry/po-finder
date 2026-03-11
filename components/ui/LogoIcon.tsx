export default function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 40 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter:
          "drop-shadow(0 0 6px rgba(5,150,105,0.7)) drop-shadow(0 0 14px rgba(5,150,105,0.4))",
      }}
    >
      {/* Pin body — fully filled gradient green */}
      <defs>
        <linearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M20 0C9.507 0 1 8.507 1 19c0 13.255 17.5 29.5 18.25 30.188a1.125 1.125 0 0 0 1.5 0C21.5 48.5 39 32.255 39 19 39 8.507 30.493 0 20 0z"
        fill="url(#pinGrad)"
      />
      {/* פ glyph — white, bold */}
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="white"
        letterSpacing="-0.5"
      >
        פ
      </text>
    </svg>
  );
}
