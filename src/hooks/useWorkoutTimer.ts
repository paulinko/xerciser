import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import presetWorkoutsData from '@/data/presetWorkouts.json';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useWorkoutStreak } from './useWorkoutStreak'; // Import the new hook

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  workDuration: number;
  restDuration: number;
}

export interface WorkoutSettings {
  id: string;
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
  savedWorkouts: WorkoutSettings[];
  isSpeechEnabled: boolean; // Re-added state for speech toggle
}

const initialDefaultSettings: WorkoutSettings = presetWorkoutsData[0] || {
  id: 'default-workout',
  name: "My Custom Workout",
  exercises: [{ id: 'ex-1', name: "Warm-up", sets: 1, workDuration: 30, restDuration: 15 }],
};

const CURRENT_WORKOUT_SETTINGS_KEY = 'currentWorkoutSettings';
const ALL_WORKOUTS_KEY = 'allWorkouts';
const SPEECH_ENABLED_KEY = 'isSpeechEnabled'; // Key for speech setting

export const useWorkoutTimer = () => {
  const { speak: rawSpeak } = useSpeechSynthesis(); // Get the raw speak function
  const { currentStreak, workoutHistory, recordWorkoutCompletion } = useWorkoutStreak(); // Initialize and get streak data

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
    let isSpeechEnabledFromLS = true; // Default to true

    if (typeof window !== 'undefined') {
      const storedAllWorkouts = localStorage.getItem(ALL_WORKOUTS_KEY);
      if (storedAllWorkouts) {
        try {
          savedWorkoutsFromLS = JSON.parse(storedAllWorkouts);
        } catch (error) {
          console.error("Failed to parse stored all workouts:", error);
        }
      }

      const storedSpeechEnabled = localStorage.getItem(SPEECH_ENABLED_KEY);
      if (storedSpeechEnabled !== null) {
        isSpeechEnabledFromLS = JSON.parse(storedSpeechEnabled);
      }
    }

    // Use a Map to merge presets and saved workouts, with saved workouts taking precedence
    const allWorkoutsMap = new Map<string, WorkoutSettings>();

    // Add presets first
    presetWorkoutsData.forEach(workout => {
      allWorkoutsMap.set(workout.id, workout);
    });

    // Add saved workouts, overwriting presets if IDs conflict
    savedWorkoutsFromLS.forEach(workout => {
      allWorkoutsMap.set(workout.id, workout);
    });

    const allAvailableWorkouts = Array.from(allWorkoutsMap.values());

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
      isSpeechEnabled: isSpeechEnabledFromLS, // Initialize speech setting
    };
  }, []);

  const [state, setState] = useState<WorkoutTimerState>(getInitialState);
  const [totalWorkoutDuration, setTotalWorkoutDuration] = useState(0);
  const [elapsedWorkoutTime, setElapsedWorkoutTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const currentExercise = state.settings.exercises[state.currentExerciseIndex];

  // Wrapped speak function to respect isSpeechEnabled
  const speak = useCallback((text: string, lang?: string) => {
    if (state.isSpeechEnabled) {
      rawSpeak(text, lang);
    }
  }, [state.isSpeechEnabled, rawSpeak]);

  // Sound effects
  const workStartSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/work_start.mp3') : null);
  const restStartSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/rest_start.mp3') : null);
  const countdownBeepSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/countdown_beep.mp3') : null);
  const workoutCompleteSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sounds/workout_complete.mp3') : null);

  // Store previous state to detect changes for sound effects and speech
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
        speak(`Workout started. First exercise: ${currentExercise.name}, set ${state.currentExerciseSet}.`);
      } else {
        restStartSound.current?.play();
        speak(`Rest for ${currentExercise.name}, set ${state.currentExerciseSet}.`);
      }
    } else if (state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: false }));
      toast.info("Workout resumed!");
      speak("Workout resumed.");
    }
  }, [state.isActive, state.isPaused, state.isWorking, currentExercise, state.settings.name, speak, state.currentExerciseSet]);

  const pause = useCallback(() => {
    if (state.isActive && !state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: true }));
      toast.info("Workout paused.");
      speak("Workout paused.");
    }
  }, [state.isActive, state.isPaused, speak]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const firstExercise = state.settings.exercises[0];
    setState(prevState => ({
      ...prevState, // Keep current settings and saved workouts
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      isWorking: true,
      isActive: false,
      isPaused: false,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    setElapsedWorkoutTime(0);
    speak("Workout reset.");
  }, [state.settings, speak]);

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
      let announcement = "";

      if (prevState.isWorking) {
        if (prevState.currentExerciseSet < currentEx.sets) {
          nextIsWorking = false;
          nextTime = currentEx.restDuration;
          announcement = `Skipped to Rest for ${currentEx.name}, Set ${nextCurrentExerciseSet}.`;
          toast.info(announcement);
          restStartSound.current?.play();
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            announcement = `${nextEx.name}, Set ${nextCurrentExerciseSet}.`;
            toast.info(announcement);
            workStartSound.current?.play();
          } else {
            workoutFinished = true;
            announcement = "Workout completed!";
            toast.success(announcement);
            workoutCompleteSound.current?.play();
          }
        }
      } else {
        nextCurrentExerciseSet++;
        nextIsWorking = true;
        if (nextCurrentExerciseSet <= currentEx.sets) {
          nextTime = currentEx.workDuration;
          announcement = `${currentEx.name}, Set ${nextCurrentExerciseSet}.`;
          toast.info(announcement);
          workStartSound.current?.play();
        } else {
          nextCurrentExerciseIndex++;
          if (nextCurrentExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextCurrentExerciseIndex];
            nextCurrentExerciseSet = 1;
            nextIsWorking = true;
            nextTime = nextEx.workDuration;
            announcement = `${nextEx.name}, Set ${nextCurrentExerciseSet}.`;
            toast.info(announcement);
            workStartSound.current?.play();
          } else {
            workoutFinished = true;
            announcement = "Workout completed!";
            toast.success(announcement);
            workoutCompleteSound.current?.play();
          }
        }
      }

      if (announcement) {
        speak(announcement);
      }

      if (workoutFinished) {
        recordWorkoutCompletion(prevState.settings); // Record workout completion
        const firstExercise = prevState.settings.exercises[0];
        return {
          ...prevState, // Keep current settings and saved workouts
          currentExerciseIndex: 0,
          currentExerciseSet: 1,
          isWorking: true,
          isActive: false,
          isPaused: false,
          currentTime: firstExercise ? firstExercise.workDuration : 0,
        };
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
  }, [state.settings.exercises, speak, recordWorkoutCompletion]);

  // New functions for managing saved workouts
  const saveWorkout = useCallback((workoutName: string, exercisesToSave: Exercise[]) => {
    if (exercisesToSave.length === 0) {
      toast.error("Cannot save an empty workout. Please add at least one exercise.");
      return;
    }
    const newWorkout: WorkoutSettings = {
      id: `workout-${Date.now()}`, // Ensure unique ID for saved workouts
      name: workoutName,
      exercises: exercisesToSave, // Use exercisesToSave here
    };
    setState(prevState => {
      // Use a Map to ensure uniqueness and prioritize the newly saved workout
      const updatedWorkoutsMap = new Map<string, WorkoutSettings>();
      prevState.savedWorkouts.forEach(w => updatedWorkoutsMap.set(w.id, w));
      updatedWorkoutsMap.set(newWorkout.id, newWorkout); // Add/overwrite with the new workout

      const updatedWorkouts = Array.from(updatedWorkoutsMap.values());
      return { ...prevState, savedWorkouts: updatedWorkouts };
    });
    toast.success(`Workout "${workoutName}" saved!`);
    speak(`Workout "${workoutName}" saved.`);
  }, [speak]);

  const loadWorkout = useCallback((workoutId: string) => {
    const workoutToLoad = state.savedWorkouts.find(w => w.id === workoutId);
    if (workoutToLoad) {
      setSettings(workoutToLoad); // Use existing setSettings to update current workout
      toast.success(`Workout "${workoutToLoad.name}" loaded!`);
      speak(`Workout "${workoutToLoad.name}" loaded.`);
    } else {
      toast.error("Workout not found.");
    }
  }, [state.savedWorkouts, setSettings, speak]);

  const deleteWorkout = useCallback((workoutId: string) => {
    setState(prevState => {
      const updatedWorkouts = prevState.savedWorkouts.filter(w => w.id !== workoutId);
      return { ...prevState, savedWorkouts: updatedWorkouts };
    });
    toast.success("Workout deleted.");
    speak("Workout deleted.");
  }, [speak]);

  const toggleSpeech = useCallback(() => {
    setState(prevState => {
      const newState = { ...prevState, isSpeechEnabled: !prevState.isSpeechEnabled };
      if (newState.isSpeechEnabled) {
        toast.info("Speech announcements enabled.");
        rawSpeak("Speech announcements enabled.");
      } else {
        toast.info("Speech announcements disabled.");
        rawSpeak("Speech announcements disabled.");
      }
      return newState;
    });
  }, [rawSpeak]);

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

  // Effect to save speech enabled setting to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPEECH_ENABLED_KEY, JSON.stringify(state.isSpeechEnabled));
    }
  }, [state.isSpeechEnabled]);

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
                speak(`Rest for ${currentEx.name}, set ${prevState.currentExerciseSet}.`);
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
                  speak(`${nextEx.name}, set 1.`);
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
                  speak("Workout completed!");
                  recordWorkoutCompletion(prevState.settings); // Record workout completion
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  const firstExercise = prevState.settings.exercises[0];
                  return {
                    ...prevState, // Keep current settings and saved workouts
                    currentExerciseIndex: 0,
                    currentExerciseSet: 1,
                    isWorking: true,
                    isActive: false,
                    isPaused: false,
                    currentTime: firstExercise ? firstExercise.workDuration : 0,
                  };
                }
              }
            } else {
              toast.info(`Rest complete! Starting Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
              workStartSound.current?.play();
              speak(`Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
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
  }, [state.isActive, state.isPaused, state.currentTime, state.isWorking, state.currentExerciseIndex, state.currentExerciseSet, state.settings.exercises, currentExercise, reset, speak, recordWorkoutCompletion]);

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
    currentStreak, // Expose currentStreak
    workoutHistory, // Expose workoutHistory
    toggleSpeech, // Expose toggle function
  };
};