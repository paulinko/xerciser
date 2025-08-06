import React, { useState } from "react";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { WorkoutEditor } from "./WorkoutEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, SkipForward, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { CustomProgressBar } from "./CustomProgressBar";

const WorkoutTimer: React.FC = () => {
  const {
    currentExerciseIndex,
    currentExerciseSet,
    currentWorkoutSet, // New: Get current workout set
    currentTime,
    currentPhase, // New: Get current phase
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
    savedWorkouts,
    saveWorkout,
    loadWorkout,
    deleteWorkout,
    currentStreak,
    workoutHistory,
  } = useWorkoutTimer();

  const [showConfig, setShowConfig] = useState(true);

  const handleApplyAndStartWorkout = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setShowConfig(false);
    start();
  };

  // Function to toggle config visibility and reset workout if active
  const toggleConfigVisibility = () => {
    if (!showConfig && isActive) { // If currently showing timer and workout is active
      reset(); // Reset the workout
    }
    setShowConfig(!showConfig);
  };

  const totalPhaseDuration = currentPhase === 'work'
    ? currentExercise?.workDuration || 0
    : currentPhase === 'rest'
      ? currentExercise?.restDuration || 0
      : settings.restBetweenWorkoutSets || 0; // For between workout sets rest

  const phaseProgressValue = totalPhaseDuration > 0 ? (currentTime / totalPhaseDuration) * 100 : 0;

  const overallProgressValue = totalWorkoutDuration > 0 ? (elapsedWorkoutTime / totalWorkoutDuration) * 100 : 0;
  const remainingWorkoutTime = totalWorkoutDuration - elapsedWorkoutTime;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const timerColorClass = currentPhase === 'work'
    ? "bg-red-500"
    : currentPhase === 'rest'
      ? "bg-blue-500"
      : "bg-purple-500"; // Color for rest between workout sets

  const textColorClass = currentPhase === 'work'
    ? "text-red-500"
    : currentPhase === 'rest'
      ? "text-blue-500"
      : "text-purple-500"; // Color for rest between workout sets

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between px-6">
          <CardTitle className="text-3xl font-extrabold flex-1">
            Xercise
          </CardTitle>
          <Link to="/credits">
            <Button
              variant="link"
              className="text-primary-foreground hover:text-primary-foreground/80 text-sm"
            >
              Credits
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {showConfig ? (
            <WorkoutEditor
              initialSettings={settings}
              onApplyAndStart={handleApplyAndStartWorkout}
              savedWorkouts={savedWorkouts}
              onSaveCurrentWorkout={saveWorkout}
              onLoadWorkout={loadWorkout}
              onDeleteWorkout={deleteWorkout}
              workoutHistory={workoutHistory}
              currentStreak={currentStreak}
            />
          ) : (
            <>
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  {currentPhase === 'work' ? "Work Phase" : currentPhase === 'rest' ? "Rest Phase" : "Rest Between Workout Sets"}
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
                <p className="text-lg text-muted-foreground">
                  Workout Set {currentWorkoutSet} / {settings.exerciseSets}
                </p>
                <p className="text-lg text-muted-foreground">
                  Workout Remaining: {formatTime(remainingWorkoutTime)}
                </p>
                <p className="text-lg font-semibold text-accent-foreground">
                  Current Streak: <span className="text-primary">{currentStreak}</span> days
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-left">Current Phase Progress</p>
                <CustomProgressBar
                  value={phaseProgressValue}
                  indicatorClassName={timerColorClass}
                  className="h-3 rounded-full"
                />
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground text-left">Overall Workout Progress</p>
                <CustomProgressBar
                  value={overallProgressValue}
                  indicatorClassName="bg-yellow-500"
                  className="h-3 rounded-full"
                />
              </div>


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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                  >
                    <Pause size={24} />
                    <span>Pause</span>
                  </Button>
                )}
                <Button
                  onClick={reset}
                  variant="outline"
                  className="px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                >
                  <RotateCcw size={24} />
                  <span>Reset</span>
                  </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={skip}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold flex items-center space-x-2"
                >
                  <SkipForward size={24} />
                  <span>Skip Phase</span>
                </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={toggleConfigVisibility} // Use the new toggle function
                  variant="link"
                  className="text-muted-foreground hover:text-foreground flex items-center justify-center space-x-2"
                >
                  <Settings size={20} />
                  <span>Change Workout Configuration</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutTimer;