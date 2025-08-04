import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Exercise, WorkoutSettings, useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { ExerciseForm } from "./ExerciseForm";
import { ExerciseCard } from "./ExerciseCard";
import { PlusCircle, Save, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SaveWorkoutDialog } from "./SaveWorkoutDialog";
import { Separator } from "@/components/ui/separator";

interface WorkoutEditorProps {
  initialSettings: WorkoutSettings;
  onSave: (settings: WorkoutSettings) => void;
}

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({
  initialSettings,
  onSave,
}) => {
  const {
    settings, // Get current settings from hook
    setSettings, // Use hook's setSettings
    savedWorkouts,
    saveWorkoutAs,
    loadSavedWorkout,
    deleteSavedWorkout,
  } = useWorkoutTimer(); // Use the hook directly to manage state

  const [workoutName, setWorkoutName] = useState(settings.name);
  const [exercises, setExercises] = useState<Exercise[]>(settings.exercises);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Update local state when settings from hook change (e.g., after loading a workout)
  React.useEffect(() => {
    setWorkoutName(settings.name);
    setExercises(settings.exercises);
  }, [settings]);

  const handleAddExercise = () => {
    const newId = `ex-${Date.now()}`;
    setExercises([
      ...exercises,
      {
        id: newId,
        name: `New Exercise ${exercises.length + 1}`,
        sets: 3,
        workDuration: 60,
        restDuration: 30,
      },
    ]);
    setEditingExerciseId(newId);
  };

  const handleEditExercise = (exerciseId: string) => {
    setEditingExerciseId(exerciseId);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
    toast.success("Exercise deleted.");
  };

  const handleSaveExercise = (updatedExercise: Exercise) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === updatedExercise.id ? updatedExercise : ex
      )
    );
    setEditingExerciseId(null);
    toast.success("Exercise saved.");
  };

  const handleCancelEdit = () => {
    setEditingExerciseId(null);
  };

  const handleApplyWorkoutSettings = () => {
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise to apply the workout.");
      return;
    }
    const newSettings = { name: workoutName, exercises };
    setSettings(newSettings); // Update the global settings via the hook
    onSave(newSettings); // Notify parent (WorkoutTimer) to close config
    toast.success("Workout configuration applied!");
  };

  const handleSaveCurrentWorkout = (name: string) => {
    if (exercises.length === 0) {
      toast.error("Cannot save an empty workout. Please add at least one exercise.");
      return;
    }
    saveWorkoutAs({ name, exercises });
  };

  const handleLoadWorkout = (name: string) => {
    loadSavedWorkout(name);
  };

  const handleDeleteSavedWorkout = (name: string) => {
    deleteSavedWorkout(name);
  };

  const editingEx = editingExerciseId
    ? exercises.find((ex) => ex.id === editingExerciseId)
    : null;

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-foreground">Configure Workout</h2>

      <div className="space-y-2">
        <Label htmlFor="workoutName" className="text-foreground">Workout Name</Label>
        <Input
          id="workoutName"
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="e.g., Full Body Blast"
          className="bg-input text-foreground"
        />
      </div>

      <Button
        onClick={() => setIsSaveDialogOpen(true)}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-2"
      >
        <Save size={20} />
        <span>Save Current Workout</span>
      </Button>

      <Separator className="my-6" />

      <h3 className="text-xl font-semibold text-foreground mb-4">Exercises</h3>
      {exercises.length === 0 && (
        <p className="text-muted-foreground text-center">No exercises added yet. Click "Add Exercise" to begin!</p>
      )}
      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onEdit={handleEditExercise}
            onDelete={handleDeleteExercise}
            onMoveUp={() => moveExercise(exercise.id, 'up')}
            onMoveDown={() => moveExercise(exercise.id, 'down')}
            isFirst={index === 0}
            isLast={index === exercises.length - 1}
          />
        ))}
      </div>

      <Button
        onClick={handleAddExercise}
        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center justify-center space-x-2 mt-4"
      >
        <PlusCircle size={20} />
        <span>Add Exercise</span>
      </Button>

      {editingEx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-center mb-4">
              {editingEx.name ? `Edit ${editingEx.name}` : "Add New Exercise"}
            </h3>
            <ExerciseForm
              initialData={editingEx}
              onSubmit={handleSaveExercise}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleApplyWorkoutSettings}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
      >
        Apply Workout Settings
      </Button>

      <Separator className="my-6" />

      <h3 className="text-xl font-semibold text-foreground mb-4">Saved Workouts</h3>
      {savedWorkouts.length === 0 ? (
        <p className="text-muted-foreground text-center">No saved workouts yet. Save your current workout to see it here!</p>
      ) : (
        <div className="space-y-3">
          {savedWorkouts.map((workout) => (
            <div key={workout.name} className="flex items-center justify-between bg-muted p-3 rounded-md">
              <span className="font-medium text-foreground">{workout.name}</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadWorkout(workout.name)}
                  className="flex items-center space-x-1"
                >
                  <FolderOpen size={16} />
                  <span>Load</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSavedWorkout(workout.name)}
                  className="flex items-center space-x-1"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SaveWorkoutDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveCurrentWorkout}
        initialName={workoutName}
      />
    </div>
  );
};