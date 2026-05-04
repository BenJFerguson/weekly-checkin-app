import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateCheckin,
  getGetCheckinsQueryKey,
  getGetCheckinStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, PlusCircle, Trash2, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const techEvaluationSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  rating: z.number().min(1).max(5),
});

const checkinSchema = z.object({
  name: z.string().min(2, "Name is required"),
  department: z.string().min(2, "Department is required"),
  accomplishments: z.string().min(10, "Share a bit more about your wins!"),
  goals: z.string().min(10, "What are you aiming for next?"),
  challenges: z.string().optional(),
  techEvaluations: z.array(techEvaluationSchema),
});

type CheckinFormValues = z.infer<typeof checkinSchema>;

const StarRating = ({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (r: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-full"
        >
          <Star
            className={`w-8 h-8 transition-colors duration-200 ${
              (hoverRating || rating) >= star
                ? "fill-pink-400 text-pink-400"
                : "fill-transparent text-pink-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function SubmitCheckin({ onNavigateToDashboard }: { onNavigateToDashboard: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCheckin = useCreateCheckin();

  const form = useForm<CheckinFormValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      name: "",
      department: "",
      accomplishments: "",
      goals: "",
      challenges: "",
      techEvaluations: [
        { toolName: "", description: "", link: "", rating: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "techEvaluations",
  });

  const onSubmit = async (data: CheckinFormValues) => {
    try {
      await createCheckin.mutateAsync({
        data: {
          ...data,
          challenges: data.challenges || null,
          techEvaluations: data.techEvaluations.map((evalData) => ({
            ...evalData,
            link: evalData.link || null,
          })),
        },
      });

      queryClient.invalidateQueries({ queryKey: getGetCheckinsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCheckinStatsQueryKey() });

      toast({
        title: "Check-in Submitted!",
        description: "Your updates have been shared. Great job this week!",
        className: "bg-pink-50 border-pink-200 text-pink-900",
      });

      form.reset();
      onNavigateToDashboard();
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Something went wrong saving your check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-12">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-bubbly border border-pink-50 transition-all duration-300 hover:shadow-bubbly-hover">
          <h2 className="font-display text-3xl text-pink-500 mb-6 flex items-center gap-2">
            <span className="bg-pink-100 p-2 rounded-full"><Sparkles className="w-6 h-6 text-pink-500" /></span>
            Your Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold text-base">Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alex" className="input-bubbly text-lg py-6" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400 font-medium" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold text-base">Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" className="input-bubbly text-lg py-6" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400 font-medium" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-bubbly border border-pink-50 transition-all duration-300 hover:shadow-bubbly-hover">
          <h2 className="font-display text-3xl text-pink-500 mb-6">Weekly Update</h2>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="accomplishments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold text-base">Wins & Accomplishments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you crush this week?"
                      className="input-bubbly min-h-[100px] text-base resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 font-medium" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold text-base">Goals for Next Week</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's on deck?"
                      className="input-bubbly min-h-[100px] text-base resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 font-medium" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-900 font-bold text-base">Challenges or Blockers? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything holding you back?"
                      className="input-bubbly min-h-[100px] text-base resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 font-medium" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-bubbly border border-pink-50 transition-all duration-300 hover:shadow-bubbly-hover">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-3xl text-pink-500">Tools Evaluated</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ toolName: "", description: "", link: "", rating: 0 })}
              className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 bg-white"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Another Tool
            </Button>
          </div>

          <div className="space-y-8">
            <AnimatePresence>
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100 relative group"
                >
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="absolute right-4 top-4 text-pink-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <FormField
                      control={form.control}
                      name={`techEvaluations.${index}.toolName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-pink-900 font-bold">Tool Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Framer Motion" className="input-bubbly" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`techEvaluations.${index}.link`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-pink-900 font-bold">Link (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." className="input-bubbly" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`techEvaluations.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-pink-900 font-bold">What did you think?</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Initial thoughts..." className="input-bubbly" {...field} />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:col-span-2 pt-2">
                      <FormField
                        control={form.control}
                        name={`techEvaluations.${index}.rating`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-pink-900 font-bold block mb-2">Rating</FormLabel>
                            <FormControl>
                              <StarRating
                                rating={field.value}
                                onRatingChange={field.onChange}
                              />
                            </FormControl>
                            {form.formState.errors.techEvaluations?.[index]?.rating && (
                              <p className="text-sm font-medium text-red-400 mt-2">Please give a rating!</p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <Button
            type="submit"
            disabled={createCheckin.isPending}
            className="rounded-full bg-gradient-bubbly text-white px-10 py-8 text-xl font-display tracking-wide shadow-bubbly hover:shadow-bubbly-hover transition-all duration-300 hover:scale-105 border-none"
          >
            {createCheckin.isPending ? (
              <span className="flex items-center gap-2">Sending...</span>
            ) : (
              <span className="flex items-center gap-3">
                <Send className="w-6 h-6" /> Submit Check-In
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
