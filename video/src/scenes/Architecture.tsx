import { Enter, Label, colors } from "../design";
export const Architecture = () => (
  <div style={{ padding: "160px 120px" }}>
    <Enter>
      <Label>The deployed AWS path</Label>
      <h1 style={{ fontSize: 82, letterSpacing: -4, margin: "0 0 55px" }}>
        A public app. Inspectable evidence.
      </h1>
    </Enter>
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {[
        ["Amazon ECR", "Container image"],
        ["AWS App Runner", "React · Express · Chromium"],
        ["CloudFormation", "Infrastructure"],
      ].map(([t, d], i) => (
        <Enter key={t} delay={16 + i * 16} style={{ flex: 1 }}>
          <div
            style={{
              background: i === 1 ? colors.lavender : "white",
              borderRadius: 28,
              padding: 40,
              height: 210,
              border: "1px solid #dfd7eb",
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 750, marginBottom: 25 }}>
              {t}
            </div>
            <div style={{ fontSize: 28, color: colors.muted }}>{d}</div>
          </div>
        </Enter>
      ))}
    </div>
    <Enter delay={48}>
      <div style={{ display: "flex", gap: 25, marginTop: 35, fontSize: 29 }}>
        <div
          style={{
            background: "#e3f3ed",
            padding: "24px 32px",
            borderRadius: 20,
          }}
        >
          Playwright + deterministic compiler
        </div>
        <div
          style={{
            background: "#efedf2",
            padding: "24px 32px",
            borderRadius: 20,
            color: colors.muted,
          }}
        >
          Bedrock / AgentCore: unverified
        </div>
      </div>
      <div style={{ fontSize: 24, color: colors.muted, marginTop: 24 }}>
        One synthetic task · shared, ephemeral instance storage
      </div>
    </Enter>
  </div>
);
