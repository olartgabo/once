import { CanvasImage, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { Enter, Label, colors } from "../design";
export const Verify = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 65,
          top: 125,
          width: 1290,
          height: 845,
          overflow: "hidden",
          borderRadius: 22,
          background: "white",
          boxShadow: "0 16px 60px #33235618",
        }}
      >
        {frame < 135 ? (
          <Video
            src={staticFile("media/demo.mp4")}
            muted
            trimBefore={71 * 30}
            trimAfter={84 * 30}
            playbackRate={13 / 4.5}
            style={{ width: "100%", height: "100%" }}
            objectFit="contain"
          />
        ) : (
          <CanvasImage
            src={staticFile("media/verified-run.png")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </div>
      <Enter style={{ position: "absolute", left: 1420, top: 225, width: 425 }}>
        <Label>Observed outcome</Label>
        <div style={{ fontSize: 35, color: "#ab5265", marginBottom: 25 }}>
          Selector replay failed
        </div>
        <div
          style={{
            fontSize: 47,
            color: colors.green,
            fontWeight: 750,
            lineHeight: 1.1,
          }}
        >
          Semantic binding passed
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            letterSpacing: -4,
            marginTop: 38,
          }}
        >
          6 / 6
        </div>
        <div style={{ fontSize: 30, color: colors.muted }}>
          Business checks passed
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.5,
            marginTop: 30,
            color: colors.muted,
          }}
        >
          Saved invoice state.
          <br />
          Screenshots.
          <br />
          Downloaded PDF.
        </div>
      </Enter>
    </>
  );
};
