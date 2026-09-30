import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
export const colors = {
  ink: "#222239",
  purple: "#7454d2",
  lavender: "#eee8fc",
  muted: "#79778e",
  green: "#219579",
  paper: "#faf9fd",
};
export const ease = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.16, 1, 0.3, 1),
} as const;
export const Logo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontWeight: 850,
      fontSize: size,
      letterSpacing: -2,
    }}
  >
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect
        x="8"
        y="8"
        width="14"
        height="30"
        rx="6"
        stroke={colors.purple}
        strokeWidth="3"
        transform="rotate(-15 15 23)"
      />
      <rect
        x="26"
        y="6"
        width="14"
        height="30"
        rx="6"
        stroke={colors.purple}
        strokeWidth="3"
        transform="rotate(-15 33 21)"
      />
    </svg>
    once<span style={{ color: colors.purple, marginLeft: -14 }}>.</span>
  </div>
);
export const Enter: React.FC<
  React.PropsWithChildren<{ delay?: number; style?: React.CSSProperties }>
> = ({ children, delay = 0, style }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(f, [delay, delay + 18], [0, 1], ease),
        translate: `0 ${interpolate(f, [delay, delay + 24], [24, 0], ease)}px`,
      }}
    >
      {children}
    </div>
  );
};
export const Label: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div
    style={{
      color: colors.purple,
      fontSize: 24,
      fontWeight: 750,
      letterSpacing: 3,
      textTransform: "uppercase",
      marginBottom: 26,
    }}
  >
    {children}
  </div>
);
export const Header: React.FC<{ chapter: string }> = ({ chapter }) => (
  <div
    style={{
      position: "absolute",
      top: 42,
      left: 72,
      right: 72,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Logo />
    <div style={{ fontSize: 23, color: colors.muted, letterSpacing: 1 }}>
      {chapter}
    </div>
  </div>
);
