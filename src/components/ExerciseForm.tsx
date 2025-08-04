import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Exercise } from "@/hooks/useWorkoutTimer";

const exerciseFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Exercise name is required." }).max(50, { message: "Exercise name cannot exceed 50 characters." }),
  sets: z.number().min(1, { message: "Sets must be at least 1." }).max(20, { message: "Sets cannot exceed 20." }),
  workDuration: z.number().min(5, { message: "Work duration must be at least 5 seconds." }).max(300, { message: "Work duration cannot exceed 300 seconds." }),
  restDuration: z.number().min(0, { message: "Rest duration cannot be negative." }).max(180, { message: "Rest duration cannot exceed 180 seconds." }),
});

interface ExerciseFormProps {
  initialData: Exercise;
  onSubmit: (values: Exercise) => void;
  onCancel: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<z.infer<typeof exerciseFormSchema>>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: initialData,
  });

  function handleSubmit(values: z.infer<typeof exerciseFormSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Exercise Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g., Push-ups"
                  {...field}
                  className="bg-input text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sets"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Number of Sets</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="bg-input text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Work Duration (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="bg-input text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="restDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Rest Duration (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="bg-input text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Exercise
          </Button>
        </div>
      </form>
    </Form>
  );
};