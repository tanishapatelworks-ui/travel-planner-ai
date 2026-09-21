import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Car,
  Heart,
  Loader2,
  Plane,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTravelPlan, saveTrip, type PlannerInput } from "@/lib/api";

const schema = z.object({
  destination: z.string().min(2, "Enter a destination"),
  days: z.coerce.number().min(1, "At least 1 day").max(30, "Max 30 days"),
  budgetTotal: z.coerce.number().min(1000, "Min budget ₹1000"),
  startDate: z.string().optional(),
  travelers: z.coerce.number().min(1, "At least 1 traveler").max(20, "Max 20"),
  transport: z.string().min(1, "Select transport"),
});
type FormData = z.infer<typeof schema>;

const INTERESTS = ["Beaches", "Mountains", "Culture", "Food", "Adventure", "Nightlife", "Shopping", "Nature", "History", "Photography", "Relaxation", "Spiritual"];
const TRANSPORTS = ["Flight", "Train", "Bus", "Car", "Rental", "Mixed"];

const generationSteps = [
  "Analyzing your request...",
  "Understanding destination...",
  "Calculating budget...",
  "Generating itinerary...",
  "Suggesting hotels...",
  "Finding transport options...",
  "Creating packing list...",
  "Compiling final report...",
];

export default function Planner() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Beaches", "Food", "Adventure"]);
  const [generating, setGenerating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { days: 4, budgetTotal: 25000, travelers: 2, transport: "Mixed" },
  });

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const fillExample = (ex: string) => {
    const [dest, rest] = ex.split(" — ");
    const [days, budget] = rest.split(", ₹");
    setValue("destination", dest);
    setValue("days", parseInt(days, 10));
    setValue("budgetTotal", parseInt(budget.replace(/,/g, ""), 10));
  };

  const onSubmit = async (data: FormData) => {
    setGenerating(true);
    setStepIdx(0);
    const interval = setInterval(() => setStepIdx((i) => Math.min(i + 1, generationSteps.length - 1)), 600);

    try {
      const input: PlannerInput = {
        destination: data.destination,
        days: data.days,
        budgetTotal: data.budgetTotal,
        currency: "INR",
        startDate: data.startDate,
        travelers: data.travelers,
        interests: selectedInterests,
        transport: data.transport,
      };
      const plan = await generateTravelPlan(input);

      const trip = await saveTrip({
        title: `${data.destination} — ${data.days} Day Trip`,
        destination: data.destination,
        budget_total: data.budgetTotal,
        currency: "INR",
        days: data.days,
        start_date: data.startDate || null,
        travelers: data.travelers,
        interests: selectedInterests,
        transport: data.transport,
        status: "planned",
        plan,
      });

      toast.success("Trip plan generated successfully!");
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate plan");
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold lg:text-3xl">
          <Sparkles className="h-7 w-7 text-primary" /> AI Travel Planner
        </h1>
        <p className="mt-1 text-muted-foreground">Tell us about your trip and let AI create a complete plan</p>
      </div>

      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-12">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 shadow-lg animate-pulse-glow">
                    <Plane className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -right-2 -top-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Creating your travel plan</h2>
                  <div className="space-y-2">
                    {generationSteps.map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: i <= stepIdx ? 1 : 0.3 }}
                        className="flex items-center justify-center gap-2 text-sm"
                      >
                        {i < stepIdx ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : i === stepIdx ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted" />
                        )}
                        <span className={i <= stepIdx ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-6 lg:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Destination */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> Destination</Label>
                  <Input placeholder="e.g. Goa, Paris, Tokyo..." {...register("destination")} />
                  {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
                </div>

                {/* Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> Days</Label>
                    <Input type="number" min={1} max={30} {...register("days")} />
                    {errors.days && <p className="text-xs text-destructive">{errors.days.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> Start Date</Label>
                    <Input type="date" {...register("startDate")} />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Travelers</Label>
                    <Input type="number" min={1} max={20} {...register("travelers")} />
                    {errors.travelers && <p className="text-xs text-destructive">{errors.travelers.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-primary" /> Budget (₹)</Label>
                    <Input type="number" min={1000} step={1000} {...register("budgetTotal")} />
                    {errors.budgetTotal && <p className="text-xs text-destructive">{errors.budgetTotal.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Car className="h-4 w-4 text-primary" /> Transport</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register("transport")}
                    >
                      {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.transport && <p className="text-xs text-destructive">{errors.transport.message}</p>}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-primary" /> Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                          selectedInterests.includes(interest)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gap-2">
                  <Sparkles className="h-5 w-5" /> Generate My Travel Plan
                </Button>
              </form>
            </Card>

            {/* Quick examples */}
            <div className="mt-6">
              <p className="mb-3 text-sm text-muted-foreground">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Goa — 4 days, ₹25,000",
                  "Paris — 7 days, ₹1,50,000",
                  "Kerala — 5 days, ₹40,000",
                  "Tokyo — 6 days, ₹2,00,000",
                ].map((ex) => (
                  <Badge key={ex} variant="secondary" className="cursor-pointer" onClick={() => fillExample(ex)}>
                    {ex}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
