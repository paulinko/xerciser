import WorkoutTimer from "@/components/WorkoutTimer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer"; // Import useWorkoutTimer
import { cn } from "@/lib/utils"; // Import cn for conditional classes

const Index = () => {
  const { isWorking, isActive } = useWorkoutTimer(); // Get isWorking and isActive state

  // Determine background class based on workout state
  const workoutBackgroundClass = isActive
    ? (isWorking ? "bg-red-500" : "bg-blue-500")
    : "bg-background"; // Default background when not active

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500",
      workoutBackgroundClass
    )}>
      <WorkoutTimer />
      <div className="absolute top-4 left-4">
        <Link to="/credits">
          <Button
            variant="link"
            className="text-white hover:text-gray-200 flex items-center justify-center space-x-2"
          >
            <span>Credits</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;