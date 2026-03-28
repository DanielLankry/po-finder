import React, { CSSProperties, ReactNode, HTMLAttributes } from "react";

interface BorderRotateProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children: ReactNode;
  className?: string;
  active?: boolean; // show border only when true
  speed?: number;   // seconds
  borderRadius?: number;
  borderWidth?: number;
  colors?: { primary: string; secondary: string; accent: string };
  bg?: string;
}

const BorderRotate: React.FC<BorderRotateProps> = ({
  children,
  className = "",
  active = false,
  speed = 3,
  borderRadius = 24,
  borderWidth = 2,
  colors = { primary: "#059669", secondary: "#34d399", accent: "#a7f3d0" },
  bg = "#ffffff",
  style = {},
  ...props
}) => {
  const wrapperStyle: CSSProperties = active
    ? {
        border: `${borderWidth}px solid transparent`,
        borderRadius: `${borderRadius}px`,
        backgroundImage: `
          linear-gradient(${bg}, ${bg}),
          conic-gradient(
            from var(--br-angle, 0deg),
            ${colors.primary} 0%,
            ${colors.secondary} 35%,
            ${colors.accent} 50%,
            ${colors.secondary} 65%,
            ${colors.primary} 100%
          )
        `,
        backgroundClip: "padding-box, border-box",
        backgroundOrigin: "padding-box, border-box",
        animation: `br-spin ${speed}s linear infinite`,
        ...style,
      }
    : {
        border: `${borderWidth}px solid transparent`,
        borderRadius: `${borderRadius}px`,
        ...style,
      };

  return (
    <>
      <style>{`
        @property --br-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes br-spin {
          to { --br-angle: 360deg; }
        }
      `}</style>
      <div
        className={className}
        style={wrapperStyle}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

export { BorderRotate };
