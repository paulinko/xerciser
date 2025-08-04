import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
}

export const SaveWorkoutDialog: React.FC<SaveWorkoutDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = "",
}) => {
  const [workoutName, setWorkoutName] = useState(initialName);

  useEffect(() => {
    setWorkoutName(initialName);
  }, [initialName, isOpen]);

  const handleSave = () => {
    if (workoutName.trim()) {
      onSave(workoutName.trim());
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Workout</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a name for your workout to save it. If a workout with this name already exists, it will be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workoutName" className="sr-only">
              Workout Name
            </Label>
            <Input
              id="workoutName"
              placeholder="e.g., My Morning Routine"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={!workoutName.trim()}>
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};