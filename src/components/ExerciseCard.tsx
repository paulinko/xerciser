import React from "react";
import { Exercise } from "@/hooks/useWorkoutTimer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  return (
    <Card className="bg-secondary text-secondary-foreground p-4 flex items-center justify-between shadow-sm">
      <div className="flex-1">
        <h4 className="text-lg font-semibold">{exercise.name}</h4>
        <p className="text-sm text-muted-foreground">
          Sets: {exercise.sets} | Work: {exercise.workDuration}s | Rest: {exercise.restDuration}s
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex flex-col space-y-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMoveUp(exercise.id)}
            disabled={isFirst}
            className="h-8 w-8"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMoveDown(exercise.id)}
            disabled={isLast}
            className="h-8 w-8"
          >
            <ArrowDown size={16} />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(exercise.id)}>
          <Edit size={20} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(exercise.id)} className="text-destructive hover:bg-destructive/10">
          <Trash2 size={20} />
        </Button>
      </div>
    </Card>
  );
};