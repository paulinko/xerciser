import { MadeWithDyad } from "@/components/made-with-dyad";
import WorkoutTimer from "@/components/WorkoutTimer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <WorkoutTimer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;