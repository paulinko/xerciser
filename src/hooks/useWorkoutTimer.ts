import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import presetWorkoutsData from '@/data/presetWorkouts.json';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  workDuration: number;
  restDuration: number;
}

export interface WorkoutSettings {
  id: string; // Added ID for unique identification
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
  savedWorkouts: WorkoutSettings[]; // New state for saved workouts
}

const initialDefaultSettings: WorkoutSettings = presetWorkoutsData[0] || {
  id: 'default-workout',
  name: "My Custom Workout",
  exercises: [{ id: 'ex-1', name: "Warm-up", sets: 1, workDuration: 30, restDuration: 15 }],
};

const CURRENT_WORKOUT_SETTINGS_KEY = 'currentWorkoutSettings';
const ALL_WORKOUTS_KEY = 'allWorkouts';

export const useWorkoutTimer = () => {
  const calculateTotalDuration = useCallback((exercises: Exercise[]) => {
    let total = 0;
    exercises.forEach(ex => {
      total += ex.sets * ex.workDuration;
      if (ex.sets > 0) {
        total += (ex.sets - 1) * ex.restDuration;
      }
    });
    return total;
  }, []);

  const getInitialState = useCallback((): WorkoutTimerState => {
    let currentSettings: WorkoutSettings;
    let savedWorkoutsFromLS: WorkoutSettings[] = [];

    if (typeof window !== 'undefined') {
      const storedAllWorkouts = localStorage.getItem(ALL_WORKOUTS_KEY);
      if (storedAllWorkouts) {
        try {
          savedWorkoutsFromLS = JSON.parse(storedAllWorkouts);
        } catch (error) {
          console.error("Failed to parse stored all workouts:", error);
        }
      }
    }

    // Merge presets with saved workouts from local storage
    const savedWorkoutIds = new Set(savedWorkoutsFromLS.map(w => w.id));
    const uniquePresetWorkouts = presetWorkoutsData.filter(preset => !savedWorkoutIds.has(preset.id));
    const allAvailableWorkouts = [...uniquePresetWorkouts, ...savedWorkoutsFromLS];

    // Determine current settings
    if (typeof window !== 'undefined') {
      const storedCurrentSettings = localStorage.getItem(CURRENT_WORKOUT_SETTINGS_KEY);
      if (storedCurrentSettings) {
        try {
          currentSettings = JSON.parse(storedCurrentSettings);
          // Ensure the loaded currentSettings is actually in allAvailableWorkouts,
          // otherwise default to the first available workout.
          if (!allAvailableWorkouts.some(w => w.id === currentSettings.id)) {
            currentSettings = allAvailableWorkouts[0] || initialDefaultSettings;
          }
        } catch (error) {
          console.error("Failed to parse stored current workout settings:", error);
          currentSettings = allAvailableWorkouts[0] || initialDefaultSettings;
        }
      } else {
        currentSettings = allAvailableWorkouts[0] || initialDefaultSettings;
      }
    } else {
      // For SSR or initial render without localStorage
      currentSettings = allAvailableWorkouts[0] || initialDefaultSettings;
    }

    const firstExercise = currentSettings.exercises[0];
    return {
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
      settings: currentSettings,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
      savedWorkouts: allAvailableWorkouts,
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
    setElapsedWorkoutTime(0);
    setTotalWorkoutDuration(calculateTotalDuration(newSettings.exercises));
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
      ...getInitialState(),
      settings: prevState.settings,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
      savedWorkouts: prevState.savedWorkouts, // Preserve saved workouts on reset
    }));
    setElapsedWorkoutTime(0);
  }, [state.settings, getInitialState]);

  const skip = useCallback(() => {
    setState(prevState => {
      const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
      if (!currentEx) {
        toast.error("No current exercise to skip.");
        return prevState;
      }

      const timeToSkip = prevState.currentTime;
      setElapsedWorkoutTime(prevElapsed => prevElapsed + timeToSkip);

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
          restStartSound.current?.play();
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
            workStartSound.current?.play();
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
            workoutCompleteSound.current?.play();
          }
        }
      } else {
        nextCurrentExerciseSet++;
        nextIsWorking = true;
        if (nextCurrentExerciseSet <= currentEx.sets) {
          nextTime = currentEx.workDuration;
          toast.info(`Skipped to ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
          workStartSound.current?.play();
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
            workStartSound.current?.play();
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
            workoutCompleteSound.current?.play();
          }
        }
      }

      if (workoutFinished) {
        const firstExercise = prevState.settings.exercises[0];
        return { ...getInitialState(), settings: prevState.settings, currentTime: firstExercise ? firstExercise.workDuration : 0, savedWorkouts: prevState.savedWorkouts };
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

  // New functions for managing saved workouts
  const saveWorkout = useCallback((workoutName: string) => {
    if (state.settings.exercises.length === 0) {
      toast.error("Cannot save an empty workout. Please add at least one exercise.");
      return;
    }
    const newWorkout: WorkoutSettings = {
      ...state.settings,
      id: `workout-${Date.now()}`,
      name: workoutName,
    };
    setState(prevState => {
      const updatedWorkouts = [...prevState.savedWorkouts, newWorkout];
      return { ...prevState, savedWorkouts: updatedWorkouts };
    });
    toast.success(`Workout "${workoutName}" saved!`);
  }, [state.settings]);

  const loadWorkout = useCallback((workoutId: string) => {
    const workoutToLoad = state.savedWorkouts.find(w => w.id === workoutId);
    if (workoutToLoad) {
      setSettings(workoutToLoad); // Use existing setSettings to update current workout
      toast.success(`Workout "${workoutToLoad.name}" loaded!`);
    } else {
      toast.error("Workout not found.");
    }
  }, [state.savedWorkouts, setSettings]);

  const deleteWorkout = useCallback((workoutId: string) => {
    setState(prevState => {
      const updatedWorkouts = prevState.savedWorkouts.filter(w => w.id !== workoutId);
      return { ...prevState, savedWorkouts: updatedWorkouts };
    });
    toast.success("Workout deleted.");
  }, []);

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

  // Effect to save current settings to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_WORKOUT_SETTINGS_KEY, JSON.stringify(state.settings));
    }
  }, [state.settings]);

  // Effect to save all saved workouts to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALL_WORKOUTS_KEY, JSON.stringify(state.savedWorkouts));
    }
  }, [state.savedWorkouts]);

  // Main timer effect
  useEffect(() => {
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

          setElapsedWorkoutTime(prevElapsed => prevElapsed + 1);

          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            if (prevState.isWorking) {
              if (prevState.currentExerciseSet < currentEx.sets) {
                toast.info(`Set ${prevState.currentExerciseSet} of ${currentEx.name} complete! Time for rest.`);
                restStartSound.current?.play();
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
                  workStartSound.current?.play();
                  return {
                    ...prevState,
                    currentExerciseIndex: nextExerciseIndex,
                    currentExerciseSet: 1,
                    isWorking: true,
                    currentTime: nextEx.workDuration,
                  };
                } else {
                  toast.success("Workout completed!");
                  workoutCompleteSound.current?.play();
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  const firstExercise = prevState.settings.exercises[0];
                  return {
                    ...getInitialState(),
                    settings: prevState.settings,
                    currentTime: firstExercise ? firstExercise.workDuration : 0,
                    savedWorkouts: prevState.savedWorkouts,
                  };
                }
              }
            } else {
              toast.info(`Rest complete! Starting Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
              workStartSound.current?.play();
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
    saveWorkout,
    loadWorkout,
    deleteWorkout,
  };
};