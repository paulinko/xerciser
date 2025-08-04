import React, { useState } from "react";
import { WorkoutSettings } from "@/hooks/useWorkoutTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Play, Save } from "lucide-react";
import { toast } from "sonner";

interface WorkoutLibraryProps {
  savedWorkouts: WorkoutSettings[];
  onLoadWorkout: (id: string) => void;
  onDeleteWorkout: (id: string) => void;
  onSaveCurrentWorkout: (name: string) => void;
  currentWorkoutName: string; // To pre-fill save input
}

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
  savedWorkouts,
  onLoadWorkout,
  onDeleteWorkout,
  onSaveCurrentWorkout,
  currentWorkoutName,
}) => {
  const [newWorkoutName, setNewWorkoutName] = useState(currentWorkoutName);

  const handleSave = () => {
    if (!newWorkoutName.trim()) {
      toast.error("Workout name cannot be empty.");
      return;
    }
    onSaveCurrentWorkout(newWorkoutName);
    setNewWorkoutName(""); // Clear input after saving
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-foreground">Manage Workouts</h2>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Save Current Workout</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter workout name to save"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
            className="flex-1 bg-input text-foreground"
          />
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save size={20} className="mr-2" /> Save
          </Button>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mt-6">Saved Workouts</h3>
      {savedWorkouts.length === 0 ? (
        <p className="text-muted-foreground text-center">No workouts saved yet.</p>
      ) : (
        <div className="space-y-3">
          {savedWorkouts.map((workout) => (
            <Card key={workout.id} className="bg-secondary text-secondary-foreground p-3 flex items-center justify-between shadow-sm">
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{workout.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {workout.exercises.length} exercises
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onLoadWorkout(workout.id)}
                  className="text-green-600 hover:bg-green-600/10"
                >
                  <Play size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteWorkout(workout.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};