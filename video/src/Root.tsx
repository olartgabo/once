import "./index.css";
import { Composition } from "remotion";
import { OnceFilm } from "./Composition";
import timing from "./timing.json";
export const RemotionRoot = () => (
  <Composition
    id="OnceNarrated"
    component={OnceFilm}
    durationInFrames={Math.ceil(timing.duration * 30)}
    fps={30}
    width={1920}
    height={1080}
  />
);
