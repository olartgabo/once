import { Footage } from "./Footage";
export const Record = ({ duration }: { duration: number }) => (
  <Footage
    title="Demonstrate the task"
    detail="Globex Research · two line items · $1,700 · Net 15 · PDF export"
    start={19}
    end={42}
    duration={duration}
  />
);
