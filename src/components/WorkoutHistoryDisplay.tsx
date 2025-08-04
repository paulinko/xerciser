import React from "react";
import { WorkoutLogEntry } from "@/hooks/useWorkoutStreak";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkoutHistoryDisplayProps {
  workoutHistory: WorkoutLogEntry[];
  currentStreak: number;
}

export const WorkoutHistoryDisplay: React.FC<WorkoutHistoryDisplayProps> = ({
  workoutHistory,
  currentStreak,
}) => {
  // Ensure workoutHistory is an array before sorting
  const sortedHistory = [...(workoutHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-foreground">Workout History</h2>

      <Card className="bg-secondary text-secondary-foreground p-4 text-center shadow-sm">
        <CardTitle className="text-xl font-semibold">Current Streak</CardTitle>
        <CardContent className="p-0 pt-2">
          <p className="text-4xl font-bold text-primary">{currentStreak}</p>
          <p className="text-sm text-muted-foreground">consecutive days</p>
        </CardContent>
      </Card>

      <h3 className="text-xl font-semibold text-foreground mt-6">Past Workouts</h3>
      {sortedHistory.length === 0 ? (
        <p className="text-muted-foreground text-center">No workouts recorded yet.</p>
      ) : (
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {sortedHistory.map((entry, index) => (
              <Card key={index} className="bg-background text-foreground p-3 shadow-sm">
                <p className="text-lg font-semibold">{entry.workoutName}</p>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(entry.date).toLocaleDateString()} | Exercises: {entry.exerciseCount}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};