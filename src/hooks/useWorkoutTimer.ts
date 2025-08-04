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

const initialState: WorkoutTimerState = {
  currentExerciseIndex: 0,
  currentExerciseSet: 1,
  isWorking: true,
  isActive: false,
  isPaused: false,
  settings: {
    name: "My Custom Workout",
    exercises: [defaultExercise],
  },
  currentTime: defaultExercise.workDuration,
};

export const useWorkoutTimer = () => {
  const [state, setState] = useState<WorkoutTimerState>(initialState);
  const intervalRef = useRef<number | null>(null);

  const currentExercise = state.settings.exercises[state.currentExerciseIndex];

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
      settings: prevState.settings,
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
      let workoutFinished = false;

      if (prevState.isWorking) {
        if (prevState.currentExerciseSet < currentEx.sets) {
          nextIsWorking = false;
          nextTime = currentEx.restDuration;
          toast.info(`Skipped to Rest for ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
          }
        }
      } else {
        nextCurrentExerciseSet++;
        nextIsWorking = true;
        if (nextCurrentExerciseSet <= currentEx.sets) {
          nextTime = currentEx.workDuration;
          toast.info(`Skipped to ${currentEx.name}, Set ${nextCurrentExerciseSet}`);
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            toast.info(`Skipped to ${nextEx.name}, Set ${nextCurrentExerciseSet}`);
          } else {
            workoutFinished = true;
            toast.success("Workout completed!");
          }
        }
      }

      if (workoutFinished) {
        return { ...initialState, settings: prevState.settings, currentTime: prevState.settings.exercises[0]?.workDuration || 0 };
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

          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            if (prevState.isWorking) {
              if (prevState.currentExerciseSet < currentEx.sets) {
                toast.info(`Set ${prevState.currentExerciseSet} of ${currentEx.name} complete! Time for rest.`);
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
                  return {
                    ...prevState,
                    currentExerciseIndex: nextExerciseIndex,
                    currentExerciseSet: 1,
                    isWorking: true,
                    currentTime: nextEx.workDuration,
                  };
                } else {
                  toast.success("Workout completed!");
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  const firstExercise = prevState.settings.exercises[0];
                  return {
                    ...initialState,
                    settings: prevState.settings,
                    currentTime: firstExercise ? firstExercise.workDuration : 0,
                  };
                }
              }
            } else {
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
  }, [state.isActive, state.isPaused, state.currentTime, state.isWorking, state.currentExerciseIndex, state.currentExerciseSet, state.settings.exercises, currentExercise, reset]);

  return {
    ...state,
    setSettings,
    start,
    pause,
    reset,
    skip,
    currentExercise,
  };
};