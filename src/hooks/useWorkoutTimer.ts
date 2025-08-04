import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface WorkoutSettings {
  sets: number;
  workDuration: number; // in seconds
  restDuration: number; // in seconds
}

interface WorkoutTimerState {
  currentSet: number;
  currentTime: number;
  isWorking: boolean; // true for work, false for rest
  isActive: boolean; // true if timer is running or paused
  isPaused: boolean;
  settings: WorkoutSettings;
}

const initialState: WorkoutTimerState = {
  currentSet: 1,
  currentTime: 0,
  isWorking: true,
  isActive: false,
  isPaused: false,
  settings: { sets: 3, workDuration: 60, restDuration: 30 }, // Default settings
};

export const useWorkoutTimer = () => {
  const [state, setState] = useState<WorkoutTimerState>(initialState);
  const intervalRef = useRef<number | null>(null);

  const setSettings = useCallback((newSettings: WorkoutSettings) => {
    setState(prevState => ({
      ...prevState,
      settings: newSettings,
      currentTime: newSettings.workDuration, // Reset current time to work duration when settings change
      currentSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
    }));
  }, []);

  const start = useCallback(() => {
    if (!state.isActive) {
      setState(prevState => ({
        ...prevState,
        isActive: true,
        isPaused: false,
        currentTime: prevState.isWorking ? prevState.settings.workDuration : prevState.settings.restDuration,
      }));
      toast.success("Workout started!");
    } else if (state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: false }));
      toast.info("Workout resumed!");
    }
  }, [state.isActive, state.isPaused, state.isWorking, state.settings]);

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
    setState(prevState => ({
      ...initialState,
      settings: prevState.settings, // Keep current settings
      currentTime: prevState.settings.workDuration,
    }));
    toast.info("Workout reset.");
  }, []);

  const skip = useCallback(() => {
    setState(prevState => {
      let nextCurrentSet = prevState.currentSet;
      let nextIsWorking = prevState.isWorking;
      let nextTime = 0;

      if (prevState.isWorking) {
        // Currently working, switch to rest or next set
        if (prevState.currentSet < prevState.settings.sets) {
          nextIsWorking = false;
          nextTime = prevState.settings.restDuration;
          toast.info(`Skipped to Rest for Set ${nextCurrentSet}`);
        } else {
          // Last work period, finish workout
          toast.success("Workout completed!");
          return { ...initialState, settings: prevState.settings, currentTime: prevState.settings.workDuration };
        }
      } else {
        // Currently resting, switch to next work period
        nextCurrentSet++;
        nextIsWorking = true;
        nextTime = prevState.settings.workDuration;
        toast.info(`Skipped to Work for Set ${nextCurrentSet}`);
      }

      return {
        ...prevState,
        currentSet: nextCurrentSet,
        isWorking: nextIsWorking,
        currentTime: nextTime,
        isPaused: false,
      };
    });
  }, [state.settings]);

  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setState(prevState => {
          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            // Time is up for current phase
            if (prevState.isWorking) {
              // Finished work period
              if (prevState.currentSet < prevState.settings.sets) {
                // Move to rest period
                toast.info(`Set ${prevState.currentSet} complete! Time for rest.`);
                return {
                  ...prevState,
                  isWorking: false,
                  currentTime: prevState.settings.restDuration,
                };
              } else {
                // Last work period finished, workout complete
                toast.success("Workout completed!");
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                return { ...initialState, settings: prevState.settings, currentTime: prevState.settings.workDuration };
              }
            } else {
              // Finished rest period, move to next work period
              toast.info(`Rest complete! Starting Set ${prevState.currentSet + 1}.`);
              return {
                ...prevState,
                currentSet: prevState.currentSet + 1,
                isWorking: true,
                currentTime: prevState.settings.workDuration,
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
  }, [state.isActive, state.isPaused, state.currentTime, state.isWorking, state.currentSet, state.settings]);

  return {
    ...state,
    setSettings,
    start,
    pause,
    reset,
    skip,
  };
};