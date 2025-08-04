import WorkoutTimer from "@/components/WorkoutTimer";
import { Link } from "react-router-dom"; // Import Link
import { Button } from "@/components/ui/button"; // Import Button

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative">
      <WorkoutTimer />
      <div className="absolute top-4 left-4"> {/* Changed to top-left */}
        <Link to="/credits">
          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground flex items-center justify-center space-x-2"
          >
            <span>Credits</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;