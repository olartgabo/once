import { Enter, Label, colors } from "../design";
export const Mutation = () => (
  <div style={{ padding: "175px 120px" }}>
    <Enter>
      <Label>The mutation lab</Label>
      <h1 style={{ fontSize: 86, letterSpacing: -4, margin: "0 0 60px" }}>
        Level four. Same invoice.
      </h1>
    </Enter>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        width: 1450,
      }}
    >
      {[
        ["01", "Theme"],
        ["02", "Element IDs"],
        ["03", "Navigation & layout"],
        ["04", "Supported labels"],
      ].map(([n, t], i) => (
        <Enter key={n} delay={16 + i * 12}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 35,
              padding: "35px 45px",
              background: "white",
              border: "1px solid #e1daef",
              borderRadius: 22,
            }}
          >
            <span style={{ fontSize: 32, color: colors.purple }}>{n}</span>
            <strong style={{ fontSize: 38 }}>{t}</strong>
          </div>
        </Enter>
      ))}
    </div>
  </div>
);
