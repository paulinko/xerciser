import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  workDuration: number;
  restDuration: number;
}

export interface WorkoutSettings {
  name: string;
  exercises: Exercise[];
}

interface WorkoutTimerState {
  currentExerciseIndex: number;
  currentExerciseSet: number;
  currentTime: number;
  isWorking: boolean;
  isActive: boolean;
  isPaused: boolean;
  settings: WorkoutSettings;
}

const defaultExercise: Exercise = {
  id: 'ex-1',
  name: "Warm-up",
  sets: 1,
  workDuration: 30,
  restDuration: 15,
};

const initialDefaultSettings: WorkoutSettings = {
  name: "My Custom Workout",
  exercises: [defaultExercise],
};

const LOCAL_STORAGE_KEY = 'workoutSettings';

export const useWorkoutTimer = () => {
  const calculateTotalDuration = useCallback((exercises: Exercise[]) => {
    let total = 0;
    exercises.forEach(ex => {
      total += ex.sets * ex.workDuration;
      if (ex.sets > 0) { // Add rest duration for all sets except the last one
        total += (ex.sets - 1) * ex.restDuration;
      }
    });
    return total;
  }, []);

  const getInitialState = useCallback((): WorkoutTimerState => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSettings) {
        try {
          const parsedSettings: WorkoutSettings = JSON.parse(storedSettings);
          const firstExercise = parsedSettings.exercises[0];
          return {
            currentExerciseIndex: 0,
            currentExerciseSet: 1,
            isWorking: true,
            isActive: false,
            isPaused: false,
            settings: parsedSettings,
            currentTime: firstExercise ? firstExercise.workDuration : 0,
          };
        } catch (error) {
          console.error("Failed to parse stored workout settings:", error);
          // Fallback to default if parsing fails
        }
      }
    }
    // Default initial state if no stored settings or parsing fails
    const firstDefaultExercise = initialDefaultSettings.exercises[0];
    return {
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
      settings: initialDefaultSettings,
      currentTime: firstDefaultExercise ? firstDefaultExercise.workDuration : 0,
    };
  }, []);

  const [state, setState] = useState<WorkoutTimerState>(getInitialState);
  const [totalWorkoutDuration, setTotalWorkoutDuration] = useState(0);
  const [elapsedWorkoutTime, setElapsedWorkoutTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const currentExercise = state.settings.exercises[state.currentExerciseIndex];

  // Sound effects
  const workStartSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/work_start.mp3') : null);
  const restStartSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/rest_start.mp3') : null);
  const countdownBeepSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/countdown_beep.mp3') : null);
  const workoutCompleteSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/workout_complete.mp3') : null);

  // Store previous state to detect changes for sound effects
  const prevStateRef = useRef<WorkoutTimerState | null>(null);

  const setSettings = useCallback((newSettings: WorkoutSettings) => {
    const firstExercise = newSettings.exercises[0];
    setState(prevState => ({
      ...prevState,
      settings: newSettings,
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    setElapsedWorkoutTime(0); // Reset elapsed time when settings change
    setTotalWorkoutDuration(calculateTotalDuration(newSettings.exercises)); // Recalculate total duration
  }, [calculateTotalDuration]);

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
      // Play initial work sound if starting in work phase
      if (state.isWorking) {
        workStartSound.current?.play();
      } else {
        restStartSound.current?.play();
      }
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
      ...getInitialState(), // Use getInitialState to reset to stored or default
      settings: prevState.settings, // Keep current settings
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    setElapsedWorkoutTime(0); // Reset elapsed time
  }, [state.settings, getInitialState]);

  const skip = useCallback(() => {
    setState(prevState => {
      const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
      if (!currentEx) {
        toast.error("No current exercise to skip.");
        return prevState;
      }

      const timeToSkip = prevState.currentTime; // Time remaining in current phase
      setElapsedWorkoutTime(prevElapsed => prevElapsed + timeToSkip); // Add remaining time to elapsed

      let nextCurrentExerciseIndex = prevState.currentExerciseIndex;
      let nextCurrentExerciseSet = prevState.currentExerciseSet;
      let nextIsWorking = prevState.isWorking;
      let nextTime = 0;
      let workoutFinished = false;

      if (prevState.isWorking) {
        if (prevState.currentExerciseSet < currentEx.sets) {
          nextIsWorking = false;
          nextTime = currentEx.restDuration;
          toast.info(`Skipped to Rest for ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
          restStartSound.current?.play(); // Play rest sound on skip
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
            workStartSound.current?.play(); // Play work sound on skip
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
            workoutCompleteSound.current?.play(); // Play complete sound on skip
          }
        }
      } else {
        nextCurrentExerciseSet++;
        nextIsWorking = true;
        if (nextCurrentExerciseSet <= currentEx.sets) {
          nextTime = currentEx.workDuration;
          toast.info(`Skipped to ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
          workStartSound.current?.play(); // Play work sound on skip
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
            workStartSound.current?.play(); // Play work sound on skip
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
            workoutCompleteSound.current?.play(); // Play complete sound on skip
          }
        }
      }

      if (workoutFinished) {
        const firstExercise = prevState.settings.exercises[0];
        return { ...getInitialState(), settings: prevState.settings, currentTime: firstExercise ? firstExercise.workDuration : 0 };
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
  }, [state.settings.exercises, getInitialState]);

  // Effect to initialize totalWorkoutDuration when component mounts or settings change
  useEffect(() => {
    setTotalWorkoutDuration(calculateTotalDuration(state.settings.exercises));
  }, [state.settings.exercises, calculateTotalDuration]);

  // Effect for playing countdown beep
  useEffect(() => {
    if (state.isActive && !state.isPaused && state.currentTime > 0 && state.currentTime <= 3) {
      countdownBeepSound.current?.play();
    }
  }, [state.currentTime, state.isActive, state.isPaused]);

  // Effect to save settings to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.settings));
    }
  }, [state.settings]);

  // Main timer effect
  useEffect(() => {
    // Update previous state for next render's sound logic
    prevStateRef.current = state;

    if (!currentExercise && state.settings.exercises.length > 0) {
      if (state.currentExerciseIndex >= state.settings.exercises.length) {
        reset();
      }
      return;
    }

    if (state.isActive && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setState(prevState => {
          const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
          if (!currentEx) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return prevState;
          }

          // Increment elapsed workout time
          setElapsedWorkoutTime(prevElapsed => prevElapsed + 1);

          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            // Time is 0, transition to next phase/set/exercise
            if (prevState.isWorking) {
              if (prevState.currentExerciseSet < currentEx.sets) {
                toast.info(`Set ${prevState.currentExerciseSet} of ${currentEx.name} complete! Time for rest.`);
                restStartSound.current?.play(); // Play rest sound
                return {
                  ...prevState,
                  isWorking: false,
                  currentTime: currentEx.restDuration,
                };
              } else {
                const nextExerciseIndex = prevState.currentExerciseIndex + 1;
                if (nextExerciseIndex < prevState.settings.exercises.length) {
                  const nextEx = prevState.settings.exercises[nextExerciseIndex];
                  toast.info(`Exercise "${currentEx.name}" complete! Starting "${nextEx.name}".`);
                  workStartSound.current?.play(); // Play work sound
                  return {
                    ...prevState,
                    currentExerciseIndex: nextExerciseIndex,
                    currentExerciseSet: 1,
                    isWorking: true,
                    currentTime: nextEx.workDuration,
                  };
                } else {
                  toast.success("Workout completed!");
                  workoutCompleteSound.current?.play(); // Play sound on workout completion
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  const firstExercise = prevState.settings.exercises[0];
                  return {
                    ...getInitialState(), // Use getInitialState to reset to stored or default
                    settings: prevState.settings, // Keep current settings
                    currentTime: firstExercise ? firstExercise.workDuration : 0,
                  };
                }
              }
            } else {
              toast.info(`Rest complete! Starting Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
              workStartSound.current?.play(); // Play work sound
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
  }, [state.isActive, state.isPaused, state.currentTime, state.isWorking, state.currentExerciseIndex, state.currentExerciseSet, state.settings.exercises, currentExercise, reset, getInitialState]);

  return {
    ...state,
    setSettings,
    start,
    pause,
    reset,
    skip,
    currentExercise,
    totalWorkoutDuration,
    elapsedWorkoutTime,
  };
};