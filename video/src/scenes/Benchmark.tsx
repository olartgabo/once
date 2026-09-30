import { useCurrentFrame, interpolate } from "remotion";
import { Enter, Label, colors, ease } from "../design";
export const Benchmark = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ padding: "170px 120px" }}>
      <Enter>
        <Label>Measured on the public AWS demo</Label>
        <h1 style={{ fontSize: 84, letterSpacing: -4, margin: "0 0 50px" }}>
          30 executions. No retries.
        </h1>
      </Enter>
      <div style={{ display: "flex", gap: 35 }}>
        {[
          ["Semantic binding", 15, colors.purple],
          ["Selector replay", 6, "#b0879a"],
        ].map(([t, n, c], i) => (
          <Enter key={t} delay={15 + i * 12} style={{ flex: 1 }}>
            <div
              style={{
                background: "white",
                padding: 42,
                borderRadius: 28,
                border: "1px solid #e5deed",
              }}
            >
              <div style={{ fontSize: 34, color: colors.muted }}>{t}</div>
              <div
                style={{
                  fontSize: 108,
                  fontWeight: 800,
                  letterSpacing: -6,
                  color: c as string,
                }}
              >
                {Math.round(interpolate(f, [30, 70], [0, n as number], ease))}
                <span style={{ fontSize: 64, color: "#aaa5b6" }}> / 15</span>
              </div>
              <div
                style={{
                  height: 18,
                  background: "#eeeaf3",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${interpolate(f, [30, 70], [0, ((n as number) / 15) * 100], ease)}%`,
                    background: c as string,
                    borderRadius: 20,
                  }}
                />
              </div>
            </div>
          </Enter>
        ))}
      </div>
      <Enter delay={45}>
        <div style={{ fontSize: 29, color: colors.muted, marginTop: 35 }}>
          Three seeds · five fixed levels · two methods · supported invoice
          fixture
        </div>
      </Enter>
    </div>
  );
};
