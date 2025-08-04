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
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  name: z.string().min(1, { message: "Workout name is required." }).max(50, { message: "Workout name cannot exceed 50 characters." }),
  sets: z.number().min(1, { message: "Sets must be at least 1." }).max(20, { message: "Sets cannot exceed 20." }),
  workDuration: z.number().min(5, { message: "Work duration must be at least 5 seconds." }).max(300, { message: "Work duration cannot exceed 300 seconds." }),
  restDuration: z.number().min(0, { message: "Rest duration cannot be negative." }).max(180, { message: "Rest duration cannot exceed 180 seconds." }),
});

interface WorkoutConfigFormProps {
  initialSettings: {
    name: string;
    sets: number;
    workDuration: number;
    restDuration: number;
  };
  onSave: (settings: z.infer<typeof formSchema>) => void;
  onSaveWorkout: (settings: z.infer<typeof formSchema>) => void; // New prop for saving
}

export const WorkoutConfigForm: React.FC<WorkoutConfigFormProps> = ({
  initialSettings,
  onSave,
  onSaveWorkout,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialSettings,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 bg-card rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-foreground">Configure Workout</h2>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Workout Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g., HIIT Blast"
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
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Apply Settings
        </Button>
        <Button
          type="button"
          onClick={form.handleSubmit(onSaveWorkout)}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Save Workout
        </Button>
      </form>
    </Form>
  );
};