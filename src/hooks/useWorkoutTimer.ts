import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import presetWorkoutsData from '@/data/presetWorkouts.json';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useWorkoutStreak } from './useWorkoutStreak';

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
  exerciseSets: number; // How many times to repeat the entire exercise list
  restBetweenWorkoutSets: number; // Rest duration between full workout sets
}

interface WorkoutTimerState {
  currentExerciseIndex: number;
  currentExerciseSet: number; // Current set for the *current exercise*
  currentWorkoutSet: number; // Current repetition of the *entire workout exercise list*
  currentTime: number;
  currentPhase: 'work' | 'rest' | 'between_workout_rest'; // New state to track phase type
  isActive: boolean;
  isPaused: boolean;
  settings: WorkoutSettings;
  savedWorkouts: WorkoutSettings[];
  isSpeechEnabled: boolean;
}

const initialDefaultSettings: WorkoutSettings = presetWorkoutsData[0] || {
  id: 'default-workout',
  name: "My Custom Workout",
  exercises: [{ id: 'ex-1', name: "Warm-up", sets: 1, workDuration: 30, restDuration: 15 }],
  exerciseSets: 1,
  restBetweenWorkoutSets: 30,
};

const CURRENT_WORKOUT_SETTINGS_KEY = 'currentWorkoutSettings';
const ALL_WORKOUTS_KEY = 'allWorkouts';
const SPEECH_ENABLED_KEY = 'isSpeechEnabled';

export const useWorkoutTimer = () => {
  const { speak: rawSpeak } = useSpeechSynthesis();
  const { currentStreak, workoutHistory, recordWorkoutCompletion } = useWorkoutStreak();

  const calculateTotalDuration = useCallback((settings: WorkoutSettings) => {
    let durationPerFullPass = 0;
    settings.exercises.forEach(ex => {
      durationPerFullPass += ex.sets * ex.workDuration;
      if (ex.sets > 0) {
        durationPerFullPass += (ex.sets - 1) * ex.restDuration;
      }
    });

    let total = settings.exerciseSets * durationPerFullPass;
    if (settings.exerciseSets > 1) {
      total += (settings.exerciseSets - 1) * settings.restBetweenWorkoutSets;
    }
    return total;
  }, []);

  const getInitialState = useCallback((): WorkoutTimerState => {
    let currentSettings: WorkoutSettings;
    let savedWorkoutsFromLS: WorkoutSettings[] = [];
    let isSpeechEnabledFromLS = true;

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

    const allWorkoutsMap = new Map<string, WorkoutSettings>();

    presetWorkoutsData.forEach(workout => {
      allWorkoutsMap.set(workout.id, {
        ...workout,
        exerciseSets: workout.exerciseSets || 1, // Ensure fallback
        restBetweenWorkoutSets: workout.restBetweenWorkoutSets || 30, // Ensure fallback
      });
    });

    savedWorkoutsFromLS.forEach(workout => {
      allWorkoutsMap.set(workout.id, {
        ...workout,
        exerciseSets: workout.exerciseSets || 1, // Ensure fallback for old saved data
        restBetweenWorkoutSets: workout.restBetweenWorkoutSets || 30, // Ensure fallback for old saved data
      });
    });

    const allAvailableWorkouts = Array.from(allWorkoutsMap.values());

    if (typeof window !== 'undefined') {
      const storedCurrentSettings = localStorage.getItem(CURRENT_WORKOUT_SETTINGS_KEY);
      if (storedCurrentSettings) {
        try {
          const parsedSettings: WorkoutSettings = JSON.parse(storedCurrentSettings);
          currentSettings = {
            ...parsedSettings,
            exerciseSets: parsedSettings.exerciseSets || 1,
            restBetweenWorkoutSets: parsedSettings.restBetweenWorkoutSets || 30,
          };
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
      currentSettings = allAvailableWorkouts[0] || initialDefaultSettings;
    }

    const firstExercise = currentSettings.exercises[0];
    return {
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      currentWorkoutSet: 1,
      currentPhase: 'work',
      isActive: false,
      isPaused: false,
      settings: currentSettings,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
      savedWorkouts: allAvailableWorkouts,
      isSpeechEnabled: isSpeechEnabledFromLS,
    };
  }, []);

  const [state, setState] = useState<WorkoutTimerState>(getInitialState);
  const [totalWorkoutDuration, setTotalWorkoutDuration] = useState(0);
  const [elapsedWorkoutTime, setElapsedWorkoutTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const currentExercise = state.settings.exercises[state.currentExerciseIndex];

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (state.isSpeechEnabled) {
      rawSpeak(text, lang);
    }
  }, [state.isSpeechEnabled, rawSpeak]);

  const workStartSound = useRef(typeof Audio !== 'undefined' ? new Audio(`${import.meta.env.BASE_URL}sounds/work_start.mp3`) : null);
  const restStartSound = useRef(typeof Audio !== 'undefined' ? new Audio(`${import.meta.env.BASE_URL}sounds/rest_start.mp3`) : null);
  const countdownBeepSound = useRef(typeof Audio !== 'undefined' ? new Audio(`${import.meta.env.BASE_URL}sounds/countdown_beep.mp3`) : null);
  const workoutCompleteSound = useRef(typeof Audio !== 'undefined' ? new Audio(`${import.meta.env.BASE_URL}sounds/workout_complete.mp3`) : null);

  const setSettings = useCallback((newSettings: WorkoutSettings) => {
    const firstExercise = newSettings.exercises[0];
    setState(prevState => ({
      ...prevState,
      settings: newSettings,
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      currentWorkoutSet: 1,
      currentPhase: 'work',
      isActive: false,
      isPaused: false,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    setElapsedWorkoutTime(0);
    setTotalWorkoutDuration(calculateTotalDuration(newSettings));
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
        currentTime: prevState.currentTime > 0 ? prevState.currentTime : (
          prevState.currentPhase === 'work' ? currentExercise.workDuration :
          (prevState.currentPhase === 'rest' ? currentExercise.restDuration : prevState.settings.restBetweenWorkoutSets)
        ),
      }));
      toast.success(`Workout "${state.settings.name}" started!`);
      if (state.currentPhase === 'work') {
        workStartSound.current?.play();
        speak(`${currentExercise.name}, set ${state.currentExerciseSet}.`);
      } else if (state.currentPhase === 'rest') {
        restStartSound.current?.play();
        speak(`Rest for ${currentExercise.name}, set ${state.currentExerciseSet}.`);
      }
      // No announcement for 'between_workout_rest' on start
    } else if (state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: false }));
      toast.info("Workout resumed!");
      // No announcement for "Workout resumed."
    }
  }, [state.isActive, state.isPaused, state.currentPhase, currentExercise, state.settings.name, speak, state.currentExerciseSet, state.settings.restBetweenWorkoutSets]);

  const pause = useCallback(() => {
    if (state.isActive && !state.isPaused) {
      setState(prevState => ({ ...prevState, isPaused: true }));
      toast.info("Workout paused.");
      // No announcement for "Workout paused."
    }
  }, [state.isActive, state.isPaused]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const firstExercise = state.settings.exercises[0];
    setState(prevState => ({
      ...prevState,
      currentExerciseIndex: 0,
      currentExerciseSet: 1,
      currentWorkoutSet: 1,
      currentPhase: 'work',
      isActive: false,
      isPaused: false,
      currentTime: firstExercise ? firstExercise.workDuration : 0,
    }));
    setElapsedWorkoutTime(0);
    // No announcement for "Workout reset."
  }, [state.settings]);

  const skip = useCallback(() => {
    setState(prevState => {
      const currentEx = prevState.settings.exercises[prevState.currentExerciseIndex];
      if (!currentEx) {
        toast.error("No current exercise to skip.");
        return prevState;
      }

      const timeToSkip = prevState.currentTime;
      setElapsedWorkoutTime(prevElapsed => prevElapsed + timeToSkip);

      let nextState = { ...prevState };
      let announcement = "";
      let workoutFinished = false;

      if (prevState.currentPhase === 'work') {
        if (prevState.currentExerciseSet < currentEx.sets) {
          nextState.currentPhase = 'rest';
          nextState.currentTime = currentEx.restDuration;
          announcement = `Rest for ${currentEx.name}, Set ${nextState.currentExerciseSet}.`;
          restStartSound.current?.play();
        } else {
          const nextExerciseIndex = prevState.currentExerciseIndex + 1;
          if (nextExerciseIndex < prevState.settings.exercises.length) {
            const nextEx = prevState.settings.exercises[nextExerciseIndex];
            nextState.currentExerciseIndex = nextExerciseIndex;
            nextState.currentExerciseSet = 1;
            nextState.currentPhase = 'work';
            nextState.currentTime = nextEx.workDuration;
            announcement = `${nextEx.name}, Set ${nextState.currentExerciseSet}.`;
            workStartSound.current?.play();
          } else {
            if (prevState.currentWorkoutSet < prevState.settings.exerciseSets) {
              nextState.currentPhase = 'between_workout_rest';
              nextState.currentTime = prevState.settings.restBetweenWorkoutSets;
              // No announcement for "Skipped to Rest before Workout Set X+1."
              restStartSound.current?.play();
            } else {
              workoutFinished = true;
              announcement = "Workout completed!";
              workoutCompleteSound.current?.play();
            }
          }
        }
      } else if (prevState.currentPhase === 'rest') {
        nextState.currentExerciseSet++;
        nextState.currentPhase = 'work';
        nextState.currentTime = currentEx.workDuration;
        announcement = `${currentEx.name}, Set ${nextState.currentExerciseSet}.`;
        workStartSound.current?.play();
      } else if (prevState.currentPhase === 'between_workout_rest') {
        nextState.currentWorkoutSet++;
        nextState.currentExerciseIndex = 0;
        nextState.currentExerciseSet = 1;
        nextState.currentPhase = 'work';
        const firstExerciseOfNextWorkoutSet = prevState.settings.exercises[0];
        nextState.currentTime = firstExerciseOfNextWorkoutSet ? firstExerciseOfNextWorkoutSet.workDuration : 0;
        announcement = `${firstExerciseOfNextWorkoutSet.name}, set 1.`;
        workStartSound.current?.play();
      }

      if (announcement) {
        speak(announcement);
      }

      if (workoutFinished) {
        recordWorkoutCompletion(prevState.settings);
        const firstExercise = prevState.settings.exercises[0];
        return {
          ...prevState,
          currentExerciseIndex: 0,
          currentExerciseSet: 1,
          currentWorkoutSet: 1,
          currentPhase: 'work',
          isActive: false,
          isPaused: false,
          currentTime: firstExercise ? firstExercise.workDuration : 0,
        };
      }

      return { ...nextState, isPaused: false };
    });
  }, [state.settings.exercises, speak, recordWorkoutCompletion, state.settings.restBetweenWorkoutSets]);

  const saveWorkout = useCallback((workoutName: string, exercisesToSave: Exercise[], exerciseSets: number, restBetweenWorkoutSets: number) => {
    if (exercisesToSave.length === 0) {
      toast.error("Cannot save an empty workout. Please add at least one exercise.");
      return;
    }
    const newWorkout: WorkoutSettings = {
      id: `workout-${Date.now()}`,
      name: workoutName,
      exercises: exercisesToSave,
      exerciseSets: exerciseSets,
      restBetweenWorkoutSets: restBetweenWorkoutSets,
    };
    setState(prevState => {
      const updatedWorkoutsMap = new Map<string, WorkoutSettings>();
      prevState.savedWorkouts.forEach(w => updatedWorkoutsMap.set(w.id, w));
      updatedWorkoutsMap.set(newWorkout.id, newWorkout);

      const updatedWorkouts = Array.from(updatedWorkoutsMap.values());
      return { ...prevState, savedWorkouts: updatedWorkouts };
    });
    toast.success(`Workout "${workoutName}" saved!`);
    // No announcement for "Workout saved."
  }, []);

  const loadWorkout = useCallback((workoutId: string) => {
    const workoutToLoad = state.savedWorkouts.find(w => w.id === workoutId);
    if (workoutToLoad) {
      setSettings(workoutToLoad);
      toast.success(`Workout "${workoutToLoad.name}" loaded!`);
      // No announcement for "Workout loaded."
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

  const toggleSpeech = useCallback(() => {
    setState(prevState => {
      const newState = { ...prevState, isSpeechEnabled: !prevState.isSpeechEnabled };
      if (newState.isSpeechEnabled) {
        toast.info("Speech announcements enabled.");
        rawSpeak("Speech announcements enabled.");
      } else {
        toast.info("Speech announcements disabled.");
        // No rawSpeak for disabled, as it would be immediately silenced
      }
      return newState;
    });
  }, [rawSpeak]);

  useEffect(() => {
    setTotalWorkoutDuration(calculateTotalDuration(state.settings));
  }, [state.settings, calculateTotalDuration]);

  useEffect(() => {
    if (state.isActive && !state.isPaused && state.currentTime > 0 && state.currentTime <= 3) {
      countdownBeepSound.current?.play();
    }
  }, [state.currentTime, state.isActive, state.isPaused]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_WORKOUT_SETTINGS_KEY, JSON.stringify(state.settings));
    }
  }, [state.settings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALL_WORKOUTS_KEY, JSON.stringify(state.savedWorkouts));
    }
  }, [state.savedWorkouts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPEECH_ENABLED_KEY, JSON.stringify(state.isSpeechEnabled));
    }
  }, [state.isSpeechEnabled]);

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

          setElapsedWorkoutTime(prevElapsed => prevElapsed + 1);

          if (prevState.currentTime > 1) {
            return { ...prevState, currentTime: prevState.currentTime - 1 };
          } else {
            // Phase ends
            if (prevState.currentPhase === 'work') {
              if (prevState.currentExerciseSet < currentEx.sets) {
                toast.info(`Set ${prevState.currentExerciseSet} of ${currentEx.name} complete! Time for rest.`);
                restStartSound.current?.play();
                speak(`Rest for ${currentEx.name}, set ${prevState.currentExerciseSet}.`);
                return {
                  ...prevState,
                  currentPhase: 'rest',
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
                    currentPhase: 'work',
                    currentTime: nextEx.workDuration,
                  };
                } else {
                  if (prevState.currentWorkoutSet < prevState.settings.exerciseSets) {
                    toast.info(`Workout Set ${prevState.currentWorkoutSet} complete! Rest before next workout set.`);
                    restStartSound.current?.play();
                    // No announcement for "Rest before workout set X+1."
                    return {
                      ...prevState,
                      currentPhase: 'between_workout_rest',
                      currentTime: prevState.settings.restBetweenWorkoutSets,
                    };
                  } else {
                    toast.success("Workout completed!");
                    workoutCompleteSound.current?.play();
                    speak("Workout completed!");
                    recordWorkoutCompletion(prevState.settings);
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }
                    const firstExercise = prevState.settings.exercises[0];
                    return {
                      ...prevState,
                      currentExerciseIndex: 0,
                      currentExerciseSet: 1,
                      currentWorkoutSet: 1,
                      currentPhase: 'work',
                      isActive: false,
                      isPaused: false,
                      currentTime: firstExercise ? firstExercise.workDuration : 0,
                    };
                  }
                }
              }
            } else if (prevState.currentPhase === 'rest') {
              toast.info(`Rest complete! Starting Set ${prevState.currentExerciseSet + 1} of ${currentEx.name}.`);
              workStartSound.current?.play();
              speak(`${currentEx.name}, Set ${prevState.currentExerciseSet + 1}.`);
              return {
                ...prevState,
                currentExerciseSet: prevState.currentExerciseSet + 1,
                currentPhase: 'work',
                currentTime: currentEx.workDuration,
              };
            } else if (prevState.currentPhase === 'between_workout_rest') {
              const nextWorkoutSet = prevState.currentWorkoutSet + 1;
              const firstExerciseOfNextWorkoutSet = prevState.settings.exercises[0];
              toast.info(`Starting Workout Set ${nextWorkoutSet}!`);
              workStartSound.current?.play();
              speak(`${firstExerciseOfNextWorkoutSet.name}, set 1.`);
              return {
                ...prevState,
                currentWorkoutSet: nextWorkoutSet,
                currentExerciseIndex: 0,
                currentExerciseSet: 1,
                currentPhase: 'work',
                currentTime: firstExerciseOfNextWorkoutSet.workDuration,
              };
            }
            return prevState;
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
  }, [state.isActive, state.isPaused, state.currentTime, state.currentPhase, state.currentExerciseIndex, state.currentExerciseSet, state.currentWorkoutSet, state.settings.exercises, state.settings.exerciseSets, state.settings.restBetweenWorkoutSets, currentExercise, reset, speak, recordWorkoutCompletion]);

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
    currentStreak,
    workoutHistory,
    toggleSpeech,
  };
};