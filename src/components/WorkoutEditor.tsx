import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Exercise, WorkoutSettings } from "@/hooks/useWorkoutTimer";
import { ExerciseForm } from "./ExerciseForm";
import { ExerciseCard } from "./ExerciseCard";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface WorkoutEditorProps {
  initialSettings: WorkoutSettings;
  onSave: (settings: WorkoutSettings) => void;
}

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({
  initialSettings,
  onSave,
}) => {
  const [workoutName, setWorkoutName] = useState(initialSettings.name);
  const [exercises, setExercises] = useState<Exercise[]>(initialSettings.exercises);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

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

  const handleSaveWorkout = () => {
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise to save the workout.");
      return;
    }
    onSave({ name: workoutName, exercises });
    toast.success("Workout configuration saved!");
  };

  const moveExercise = (id: string, direction: 'up' | 'down') => {
    const index = exercises.findIndex(ex => ex.id === id);
    if (index === -1) return;

    const newExercises = [...exercises];
    if (direction === 'up' && index > 0) {
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    } else if (direction === 'down' && index < newExercises.length - 1) {
      [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
    }
    setExercises(newExercises);
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

      <h3 className="text-xl font-semibold text-foreground mt-6 mb-4">Exercises</h3>
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
        onClick={handleSaveWorkout}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
      >
        Apply Workout Settings
      </Button>
    </div>
  );
};