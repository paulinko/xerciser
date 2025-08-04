import React, { useState } from "react";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { WorkoutEditor } from "./WorkoutEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, SkipForward, Settings } from "lucide-react";

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
  } = useWorkoutTimer();

  const [showConfig, setShowConfig] = useState(true);

  const handleSaveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setShowConfig(false);
  };

  const totalDuration = isWorking
    ? currentExercise?.workDuration || 0
    : currentExercise?.restDuration || 0;
  const progressValue = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const timerColorClass = isWorking
    ? "bg-green-500"
    : "bg-blue-500";

  const textColorClass = isWorking
    ? "text-green-600 dark:text-green-400"
    : "text-blue-600 dark:text-blue-400";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
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

              <Progress
                value={progressValue}
                className={`h-3 rounded-full ${timerColorClass}`}
              />

              <div className="flex justify-center space-x-4 mt-6">
                {!isActive || isPaused ? (
                  <Button
                    onClick={start}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                  >
                    <Play size={24} />
                    <span>Start</span>
                  </Button>
                ) : (
                  <Button
                    onClick={pause}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                  >
                    <Pause size={24} />
                    <span>Pause</span>
                  </Button>
                )}
                <Button
                  onClick={reset}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                >
                  <RotateCcw size={24} />
                  <span>Reset</span>
                </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={skip}
                  variant="secondary"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
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