import { useCurrentFrame, interpolate } from "remotion";
import { colors, Enter, Label, ease } from "../design";
export const Problem = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ padding: "192px 120px" }}>
      <Enter>
        <Label>The problem</Label>
        <h1
          style={{
            fontSize: 100,
            letterSpacing: -5,
            lineHeight: 1.06,
            margin: 0,
          }}
        >
          Same task.
          <br />
          <span style={{ color: colors.purple }}>Changed interface.</span>
        </h1>
      </Enter>
      <div style={{ display: "flex", gap: 24, marginTop: 65 }}>
        {["Renamed buttons", "Changed IDs", "Broken replay"].map((x, i) => (
          <Enter key={x} delay={18 + i * 14}>
            <div
              style={{
                padding: "28px 38px",
                borderRadius: 20,
                background: i === 2 ? "#fae9ed" : colors.lavender,
                fontSize: 34,
                fontWeight: 650,
                color: i === 2 ? "#ae5063" : colors.ink,
                scale: interpolate(
                  f,
                  [18 + i * 14, 45 + i * 14],
                  [0.95, 1],
                  ease,
                ),
              }}
            >
              {x}
            </div>
          </Enter>
        ))}
      </div>
    </div>
  );
};
