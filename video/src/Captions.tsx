import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import captionsData from "./captions.json";
import { colors } from "./design";
const captions: Caption[] = captionsData;
export const Captions = () => {
  const { fps } = useVideoConfig();
  const t = (useCurrentFrame() / fps) * 1000;
  const current = captions.find((c) => t >= c.startMs && t < c.endMs);
  if (!current) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        bottom: 22,
        textAlign: "center",
        zIndex: 10,
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: 28,
          lineHeight: 1.3,
          color: colors.ink,
          background: "#fffefaf5",
          padding: "13px 28px",
          borderRadius: 14,
          boxShadow: "0 3px 18px #241b3520",
          maxWidth: 1550,
        }}
      >
        {current.text.trim()}
      </span>
    </div>
  );
};
