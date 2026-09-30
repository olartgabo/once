import { Enter, Logo, colors } from "../design";
export const Outro = () => (
  <div style={{ padding: "210px 120px" }}>
    <Enter>
      <Logo size={95} />
      <h1
        style={{
          fontSize: 105,
          letterSpacing: -5,
          lineHeight: 1.05,
          margin: "55px 0 35px",
        }}
      >
        Show it once.
        <br />
        <span style={{ color: colors.purple }}>Run through change.</span>
      </h1>
      <div style={{ fontSize: 32, color: colors.muted }}>
        Inspect. Compare. Verify.
      </div>
      <div style={{ fontSize: 25, color: colors.purple, marginTop: 42 }}>
        github.com/olartgabo/once
      </div>
    </Enter>
  </div>
);
