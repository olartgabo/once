import { Video } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";
import { Enter, colors, Label } from "../design";
export const Footage = ({
  title,
  detail,
  start,
  end,
  duration,
}: {
  title: string;
  detail: string;
  start: number;
  end: number;
  duration: number;
}) => {
  const { fps } = useVideoConfig();
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 65,
          top: 129,
          width: 1328,
          height: 830,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 16px 60px #33235618",
          border: "1px solid #e4deee",
          background: "white",
        }}
      >
        <Video
          src={staticFile("media/demo.mp4")}
          muted
          trimBefore={Math.round(start * fps)}
          trimAfter={Math.round(end * fps)}
          playbackRate={(end - start) / duration}
          style={{ width: "100%", height: "100%" }}
          objectFit="contain"
        />
      </div>
      <Enter style={{ position: "absolute", left: 1450, top: 260, width: 400 }}>
        <Label>Real public demo</Label>
        <h2
          style={{
            fontSize: 53,
            letterSpacing: -2,
            lineHeight: 1.1,
            margin: "0 0 30px",
          }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 30, lineHeight: 1.45, color: colors.muted }}>
          {detail}
        </div>
        <div style={{ marginTop: 45, fontSize: 22, color: colors.green }}>
          ● AWS App Runner
        </div>
      </Enter>
    </>
  );
};
