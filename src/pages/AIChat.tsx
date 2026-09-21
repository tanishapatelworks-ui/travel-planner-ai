import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listTrips, sendChatCommand, updateTrip } from "@/lib/api";
import type { Trip, TravelPlan } from "@/types";

const QUICK_COMMANDS = [
  "Add adventure activities",
  "Remove museums",
  "Make it family-friendly",
  "Regenerate Day 2",
  "Budget ₹30000",
  "Add 2 days",
];

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("trip");
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listTrips().then((data) => {
      setTrips(data as Trip[]);
      setLoading(false);
      if (tripId) {
        const found = (data as Trip[]).find((t) => t.id === tripId);
        if (found) selectTrip(found);
      } else if (data.length > 0) {
        selectTrip(data[0] as Trip);
      }
    }).catch(() => setLoading(false));
  }, [tripId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const selectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm your AI travel assistant for your ${trip.destination} trip. I can help you modify the itinerary, adjust the budget, add or remove activities, and more. What would you like to do?`,
      },
    ]);
  };

  const send = async (text: string) => {
    if (!text.trim() || !selectedTrip?.plan) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await sendChatCommand(text, selectedTrip.plan, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);

      if (result.updatedPlan) {
        await updateTrip(selectedTrip.id, { plan: result.updatedPlan as TravelPlan });
        setSelectedTrip({ ...selectedTrip, plan: result.updatedPlan });
        toast.success("Trip updated!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold lg:text-3xl">
          <Sparkles className="h-7 w-7 text-primary" /> AI Chat Assistant
        </h1>
        <p className="mt-1 text-muted-foreground">Modify your trip dynamically with natural language</p>
      </div>

      {trips.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No trips to chat about</p>
            <p className="text-sm text-muted-foreground">Create a trip first, then come back to chat with the AI</p>
          </div>
          <Button onClick={() => navigate("/planner")} className="gap-2">
            <Sparkles className="h-4 w-4" /> Plan a Trip
          </Button>
        </Card>
      ) : (
        <>
          {/* Trip selector */}
          {trips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {trips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTrip(t)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedTrip?.id === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" /> {t.destination}
                </button>
              ))}
            </div>
          )}

          {/* Chat */}
          <Card className="flex h-[60vh] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">{selectedTrip?.destination} · {selectedTrip?.days} days</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${selectedTrip?.id}`)} className="gap-1.5">
                View Trip <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick commands */}
            <div className="border-t p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => send(cmd)}
                    disabled={sending}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to modify your trip..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                />
                <Button type="submit" size="icon" disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
