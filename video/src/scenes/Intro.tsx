import { Enter, Label, colors } from "../design";
export const Intro = () => (
  <div style={{ padding: "190px 120px" }}>
    <Enter>
      <Label>Meet Once</Label>
      <h1
        style={{
          fontSize: 108,
          letterSpacing: -6,
          lineHeight: 1.04,
          margin: 0,
        }}
      >
        Show it once.
        <br />
        <span style={{ color: colors.purple }}>Run through change.</span>
      </h1>
    </Enter>
    <div style={{ display: "flex", gap: 24, marginTop: 60 }}>
      {["01  Record", "02  Inspect", "03  Compare"].map((x, i) => (
        <Enter key={x} delay={20 + i * 12}>
          <div
            style={{
              fontSize: 36,
              padding: "28px 40px",
              border: "1px solid #dfd7ef",
              borderRadius: 18,
              background: "white",
            }}
          >
            {x}
          </div>
        </Enter>
      ))}
    </div>
  </div>
);
