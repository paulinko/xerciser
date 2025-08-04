import React, { useState } from "react";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { WorkoutEditor } from "./WorkoutEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, SkipForward, Settings } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn for conditional class names

const WorkoutTimer: React.FC = () => {
  const {
    currentExerciseIndex,
    currentExerciseSet,
    currentTime,
    isWorking,
    isActive,
    isPaused,
    settings,
    setSettings,
    start,
    pause,
    reset,
    skip,
    currentExercise,
    totalWorkoutDuration,
    elapsedWorkoutTime,
  } = useWorkoutTimer();

  const [showConfig, setShowConfig] = useState(true);

  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setShowConfig(false);
  };

  const totalPhaseDuration = isWorking
    ? currentExercise?.workDuration || 0
    : currentExercise?.restDuration || 0;
  const phaseProgressValue = totalPhaseDuration > 0 ? (currentTime / totalPhaseDuration) * 100 : 0;

  const overallProgressValue = totalWorkoutDuration > 0 ? (elapsedWorkoutTime / totalWorkoutDuration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Dynamic classes based on workout stage
  const timerColorClass = isWorking
    ? "bg-ut-orange-500" // Orange for work
    : "bg-prussian-blue-500"; // Blue for rest

  const textColorClass = isWorking
    ? "text-ut-orange-500" // Orange text for work
    : "text-prussian-blue-500"; // Blue text for rest

  const workoutBackgroundClass = isWorking
    ? "bg-ut-orange-500" // Use a stronger orange for work background
    : "bg-prussian-blue-500"; // Use a stronger blue for rest background

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-500",
      workoutBackgroundClass
    )}>
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-4">
          <CardTitle className="text-3xl font-extrabold text-center">
            Fitness Pal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {showConfig ? (
            <WorkoutEditor
              initialSettings={settings}
              onSave={handleSaveSettings}
            />
          ) : (
            <>
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  {isWorking ? "Work Phase" : "Rest Phase"}
                </p>
                <h3 className={`text-6xl font-bold ${textColorClass}`}>
                  {formatTime(currentTime)}
                </h3>
                {currentExercise && (
                  <p className="text-2xl font-semibold text-foreground">
                    {currentExercise.name} - Set {currentExerciseSet} / {currentExercise.sets}
                  </p>
                )}
                <p className="text-lg text-muted-foreground">
                  Exercise {currentExerciseIndex + 1} / {settings.exercises.length}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-left">Current Phase Progress</p>
                <Progress
                  value={phaseProgressValue}
                  className={cn("h-3 rounded-full", timerColorClass)}
                />
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground text-left">Overall Workout Progress</p>
                <Progress
                  value={overallProgressValue}
                  className="h-3 rounded-full bg-selective-yellow-500" // Distinct color for overall progress
                />
              </div>


              <div className="flex justify-center space-x-4 mt-6">
                {!isActive || isPaused ? (
                  <Button
                    onClick={start}
                    className="bg-ut-orange-600 hover:bg-ut-orange-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                  >
                    <Play size={24} />
                    <span>Start</span>
                  </Button>
                ) : (
                  <Button
                    onClick={pause}
                    className="bg-prussian-blue-600 hover:bg-prussian-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                  >
                    <Pause size={24} />
                    <span>Pause</span>
                  </Button>
                )}
                <Button
                  onClick={reset}
                  variant="outline"
                  className="border-prussian-blue-300 text-prussian-blue-700 hover:bg-prussian-blue-100 dark:border-prussian-blue-700 dark:text-prussian-blue-300 dark:hover:bg-prussian-blue-800 px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                >
                  <RotateCcw size={24} />
                  <span>Reset</span>
                </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={skip}
                  className="bg-blue-green-600 hover:bg-blue-green-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                >
                  <SkipForward size={24} />
                  <span>Skip Phase</span>
                </Button>
              </div>
              <Button
                onClick={() => setShowConfig(true)}
                variant="link"
                className="w-full text-muted-foreground hover:text-foreground mt-4 flex items-center justify-center space-x-2"
              >
                <Settings size={20} />
                <span>Change Workout Configuration</span>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutTimer;