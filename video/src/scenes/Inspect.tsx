import { Footage } from "./Footage";
export const Inspect = ({ duration }: { duration: number }) => (
  <Footage
    title="Every step is inspectable"
    detail="Recorded values, action order, and original event provenance."
    start={42}
    end={60}
    duration={duration}
  />
);
