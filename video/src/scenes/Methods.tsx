import { Enter, Label, colors } from "../design";
export const Methods = () => (
  <div style={{ padding: "170px 120px" }}>
    <Enter>
      <Label>A controlled comparison</Label>
      <h1 style={{ fontSize: 82, letterSpacing: -4, margin: "0 0 55px" }}>
        Two methods. Fresh scenarios.
      </h1>
    </Enter>
    <div style={{ display: "flex", gap: 30 }}>
      {[
        ["Selector replay", "Original recorded selectors", "#fbecf0"],
        [
          "Semantic binding",
          "Accessible roles + predefined label equivalents",
          colors.lavender,
        ],
      ].map(([t, d, c], i) => (
        <Enter key={t} delay={16 + i * 18} style={{ flex: 1 }}>
          <div
            style={{
              height: 320,
              padding: 48,
              background: c,
              borderRadius: 28,
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 750, marginBottom: 35 }}>
              {t}
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.4, color: colors.muted }}>
              {d}
            </div>
          </div>
        </Enter>
      ))}
    </div>
  </div>
);
