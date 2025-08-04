import { useState, useEffect, useCallback } from 'react';
import { WorkoutSettings } from './useWorkoutTimer'; // Assuming WorkoutSettings is defined here

export interface WorkoutLogEntry {
  date: string; // YYYY-MM-DD
  workoutName: string;
  exerciseCount: number;
}

interface StreakData {
  currentStreak: number;
  lastWorkoutDate: string | null; // YYYY-MM-DD
}

const WORKOUT_HISTORY_KEY = 'workoutHistory';
const STREAK_DATA_KEY = 'workoutStreakData';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to check if a date is yesterday
const isYesterday = (dateString: string): boolean => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const checkDate = new Date(dateString);

  return (
    checkDate.getFullYear() === yesterday.getFullYear() &&
    checkDate.getMonth() === yesterday.getMonth() &&
    checkDate.getDate() === yesterday.getDate()
  );
};

export function useWorkoutStreak() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLogEntry[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastWorkoutDate: null,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem(WORKOUT_HISTORY_KEY);
      if (storedHistory) {
        try {
          setWorkoutHistory(JSON.parse(storedHistory));
        } catch (e) {
          console.error("Failed to parse workout history from localStorage", e);
          localStorage.removeItem(WORKOUT_HISTORY_KEY);
        }
      }

      const storedStreakData = localStorage.getItem(STREAK_DATA_KEY);
      if (storedStreakData) {
        try {
          const parsedStreakData: StreakData = JSON.parse(storedStreakData);
          const today = getTodayDate();

          // Check if streak needs to be reset due to a missed day
          if (parsedStreakData.lastWorkoutDate && parsedStreakData.lastWorkoutDate !== today && !isYesterday(parsedStreakData.lastWorkoutDate)) {
            setStreakData({
              currentStreak: 0,
              lastWorkoutDate: null,
            });
          } else {
            setStreakData(parsedStreakData);
          }
        } catch (e) {
          console.error("Failed to parse streak data from localStorage", e);
          localStorage.removeItem(STREAK_DATA_KEY);
          setStreakData({ currentStreak: 0, lastWorkoutDate: null });
        }
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(workoutHistory));
    }
  }, [workoutHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STREAK_DATA_KEY, JSON.stringify(streakData));
    }
  }, [streakData]);

  const recordWorkoutCompletion = useCallback((workoutSettings: WorkoutSettings) => {
    const today = getTodayDate();

    setWorkoutHistory(prevHistory => {
      // Prevent duplicate entries for the same day
      if (prevHistory.some(entry => entry.date === today)) {
        return prevHistory;
      }

      const newEntry: WorkoutLogEntry = {
        date: today,
        workoutName: workoutSettings.name,
        exerciseCount: workoutSettings.exercises.length,
      };
      return [...prevHistory, newEntry];
    });

    setStreakData(prevStreakData => {
      let newStreak = prevStreakData.currentStreak;
      const lastDate = prevStreakData.lastWorkoutDate;

      if (lastDate === today) {
        // Already recorded for today, streak doesn't change
        return prevStreakData;
      } else if (lastDate && isYesterday(lastDate)) {
        // Consecutive day
        newStreak++;
      } else {
        // First workout or missed a day, reset streak
        newStreak = 1;
      }

      return {
        currentStreak: newStreak,
        lastWorkoutDate: today,
      };
    });
  }, []);

  return {
    currentStreak: streakData.currentStreak,
    workoutHistory,
    recordWorkoutCompletion,
  };
}