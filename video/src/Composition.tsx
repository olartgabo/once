import React from "react";
import { loadFont } from "@remotion/fonts";
loadFont({
  family: "OnceInter",
  url: staticFile("fonts/Inter.ttf"),
  weight: "100 900",
  style: "normal",
});
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { colors, Header, ease } from "./design";
import { Captions } from "./Captions";
import timing from "./timing.json";
import { Problem } from "./scenes/Problem";
import { Intro } from "./scenes/Intro";
import { Record } from "./scenes/Record";
import { Inspect } from "./scenes/Inspect";
import { Mutation } from "./scenes/Mutation";
import { Methods } from "./scenes/Methods";
import { Verify } from "./scenes/Verify";
import { Benchmark } from "./scenes/Benchmark";
import { Architecture } from "./scenes/Architecture";
import { Outro } from "./scenes/Outro";
const Fade: React.FC<React.PropsWithChildren<{ duration: number }>> = ({
  children,
  duration,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(
          f,
          [0, 10, duration - 10, duration - 1],
          [0, 1, 1, 0],
          ease,
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
export const OnceFilm = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: colors.paper,
        fontFamily: "OnceInter, sans-serif",
        color: colors.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -230,
          top: -250,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "#eee8fc",
          filter: "blur(100px)",
          opacity: 0.5,
        }}
      />
      {timing.scenes.map((s) => {
        const duration = Math.round((s.end - s.start) * 30);
        const component = {
          problem: <Problem />,
          intro: <Intro />,
          record: <Record duration={s.end - s.start} />,
          inspect: <Inspect duration={s.end - s.start} />,
          mutation: <Mutation />,
          methods: <Methods />,
          verify: <Verify />,
          benchmark: <Benchmark />,
          architecture: <Architecture />,
          outro: <Outro />,
        }[s.id];
        return (
          <Sequence
            key={s.id}
            name={s.chapter}
            from={Math.round(s.start * 30)}
            durationInFrames={duration}
          >
            <Fade duration={duration}>
              <Header chapter={s.chapter} />
              {component}
            </Fade>
          </Sequence>
        );
      })}
      <Sequence from={60} name="Your narration">
        <Audio src={staticFile("media/voiceover.wav")} />
      </Sequence>
      <Captions />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 4,
          width: `${(f / (Math.ceil(timing.duration * 30) - 1)) * 100}%`,
          background: colors.purple,
        }}
      />
    </AbsoluteFill>
  );
};
