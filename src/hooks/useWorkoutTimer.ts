import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// New Exercise interface
export interface Exercise {
  id: string; // Unique ID for React keys and reordering
  name: string;
  sets: number;
  workDuration: number; // in seconds
  restDuration: number; // in seconds
}

// Updated WorkoutSettings interface
export interface WorkoutSettings {
  name: string;
  exercises: Exercise[]; // Array of exercises
}

interface WorkoutTimerState {
  currentExerciseIndex: number; // Index of the current exercise in the array
  currentExerciseSet: number; // Current set within the current exercise
  currentTime: number;
  isWorking: boolean; // true for work, false for rest
  isActive: boolean; // true if timer is running or paused
  isPaused: boolean;
  settings: WorkoutSettings;
}

const defaultExercise: Exercise = {
  id: 'ex-1', // Initial ID
  name: "Warm-up",
  sets: 1,
  workDuration: 30,
  restDuration: 15,
};

const initialState: WorkoutTimerState = {
  currentExerciseIndex: 0,
  currentExerciseSet: 1,
  currentTime: defaultExercise.workDuration, // Initial time from the first exercise
  isWorking: true,
  isActive: false,
  isPaused: false,
  settings: {
    name: "My Custom Workout",
    exercises: [defaultExercise], // Start with one default exercise
  },
};

export const useWorkoutTimer = () => {
  const [state, setState] = useState<WorkoutTimerState>(initialState);
  const intervalRef = useRef<number | null>(null);

  // Helper to get current exercise
  const currentExercise = state.settings.exercises[state.currentExerciseIndex];

  const setSettings = useCallback((newSettings: WorkoutSettings) => {
    // When settings change, reset the timer to the beginning of the first exercise
    const firstExercise = newSettings.exercises[0];
    setState(prevState => ({
      ...prevState,
      settings: newSettings,
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
      currentTime: firstExercise ? firstExercise.workDuration : 0, // Handle empty exercises array
    }));
  }, []);

  const start = useCallback(() => {
    if (!currentExercise) {
      toast.error("No exercises configured to start the workout.");
      return;
    }
    if (!state.isActive) {
      setState(prevState => ({
        ...prevState,
        isActive: true,
        isPaused: false,
        currentTime: prevState.isWorking
          ? currentExercise.workDuration
          : currentExercise.restDuration,
      }));
      toast.success(`Workout "${state.settings.name}" started!`);
    } else if (state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: false }));
      toast.info("Workout resumed!");
    }
  }, [state.isActive, state.isPaused, state.isWorking, currentExercise, state.settings.name]);

  const pause = useCallback(() => {
    if (state.isActive && !state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: true }));
      toast.info("Workout paused.");
    }
  }, [state.isActive, state.isPaused]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const firstExercise = state.settings.exercises[0];
    setState(prevState => ({
      ...initialState,
      settings: prevState.settings, // Keep current settings
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    toast.info("Workout reset.");
  }, [state.settings]);

  const skip = useCallback(() => {
    setState(prevState => {
      const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
      if (!currentEx) {
        toast.error("No current exercise to skip.");
        return prevState;
      }

      let nextCurrentExerciseIndex = prevState.currentExerciseIndex;
      let nextCurrentExerciseSet = prevState.currentExerciseSet;
      let nextIsWorking = prevState.isWorking;
      let nextTime = 0;

      if (prevState.isWorking) {
        // Currently working, try to move to rest or next set/exercise
        if (prevState.currentExerciseSet < currentEx.sets) {
          // Move to rest for current exercise
          nextIsWorking = false;
          nextTime = currentEx.restDuration;
          toast.info(`Skipped to Rest for ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
        } else {
          // Finished all sets for current exercise, move to next exercise
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1; // Reset set count for new exercise
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
          } else {
            // All exercises completed
            toast.success("Workout completed!");
            return { ...initialState, settings: prevState.settings, currentTime: prevState.settings.exercises[0]?.workDuration || 0 };
          }
        }
      } else {
        // Currently resting, move to next work period (next set or next exercise)
        nextCurrentExerciseSet++;
        nextIsWorking = true;
        if (nextCurrentExerciseSet <= currentEx.sets) {
          // Move to next set of current exercise
          nextTime = currentEx.workDuration;
          toast.info(`Skipped to ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
        } else {
          // Finished all sets and rest for current exercise, move to next exercise
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1; // Reset set count for new exercise
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
          } else {
            // All exercises completed
            toast.success("Workout completed!");
            return { ...initialState, settings: prevState.settings, currentTime: prevState.settings.exercises[0]?.workDuration || 0 };
          }
        }
      }

      return {
        ...prevState,
        currentExerciseIndex: nextCurrentExerciseIndex,
        currentExerciseSet: nextCurrentExerciseSet,
        isWorking: nextIsWorking,
        currentTime: nextTime,
        isPaused: false,
      };
    });
  }, [state.settings.exercises]);

  useEffect(() => {
    if (!currentExercise) {
      // No exercises defined, stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (state.isActive && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setState(prevState => {
          const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
          if (!currentEx) {
            // Should not happen if check above is correct, but for safety
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return prevState;
          }

          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            // Time is up for current phase
            if (prevState.isWorking) {
              // Finished work period for current set
              if (prevState.currentExerciseSet < currentEx.sets) {
                // Move to rest period for current exercise
                toast.info(`Set ${prevState.currentExerciseSet} of ${currentEx.name} complete! Time for rest.`);
                return {
                  ...prevState,
                  isWorking: false,
                  currentTime: currentEx.restDuration,
                };
              } else {
                // Finished all sets for current exercise, move to next exercise
                const nextExerciseIndex = prevState.currentExerciseIndex + 1;
                if (nextExerciseIndex < prevState.settings.exercises.length) {
                  const nextEx = prevState.settings.exercises[nextExerciseIndex];
                  toast.info(`Exercise "${currentEx.name}" complete! Starting "${nextEx.name}".`);
                  return {
                    ...prevState,
                    currentExerciseIndex: nextExerciseIndex,
                    currentExerciseSet: 1, // Reset set count for new exercise
                    isWorking: true,
                    currentTime: nextEx.workDuration,
                  };
                } else {
                  // All exercises completed
                  toast.success("Workout completed!");
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  // Reset to initial state but keep current settings
                  const firstExercise = prevState.settings.exercises[0];
                  return {
                    ...initialState,
                    settings: prevState.settings,
                    currentTime: firstExercise ? firstExercise.workDuration : 0,
                  };
                }
              }
            } else {
              // Finished rest period, move to next work period (next set)
              toast.info(`Rest complete! Starting Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
              return {
                ...prevState,
                currentExerciseSet: prevState.currentExerciseSet + 1,
                isWorking: true,
                currentTime: currentEx.workDuration,
              };
            }
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused, state.currentTime, state.isWorking, state.currentExerciseIndex, state.currentExerciseSet, state.settings.exercises, currentExercise]);

  return {
    ...state,
    setSettings,
    start,
    pause,
    reset,
    skip,
    currentExercise, // Expose current exercise for display
  };
};