import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  addMessage,
  listMessages,
  sendChatCommand,
  updateTrip,
  getTrip,
} from "@/lib/api";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

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

// ========================================
// HELPER: GET NUMBER OF DAYS
// ========================================

function getPlanDays(
  plan: TravelPlan,
  oldDays: number
): number {
  const anyPlan = plan as any;

  // 1. If AI returns explicit days
  if (
    typeof anyPlan.days === "number" &&
    anyPlan.days > 0
  ) {
    return anyPlan.days;
  }

  // 2. If itinerary is an array
  if (
    Array.isArray(anyPlan.itinerary) &&
    anyPlan.itinerary.length > 0
  ) {
    return anyPlan.itinerary.length;
  }

  // 3. Sometimes plans may use dailyPlan
  if (
    Array.isArray(anyPlan.dailyPlan) &&
    anyPlan.dailyPlan.length > 0
  ) {
    return anyPlan.dailyPlan.length;
  }

  // 4. Sometimes plans may use daysData
  if (
    Array.isArray(anyPlan.daysData) &&
    anyPlan.daysData.length > 0
  ) {
    return anyPlan.daysData.length;
  }

  return oldDays;
}

export default function AIChat() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("trip");
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] =
    useState<Trip | null>(null);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ========================================
  // LOAD TRIPS FROM FIREBASE
  // ========================================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTrips([]);
      setSelectedTrip(null);
      setLoading(false);
      return;
    }

    const tripsQuery = query(
      collection(db, "trips"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const tripData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Trip[];

        tripData.sort((a: any, b: any) => {
          const aTime =
            a.created_at?.toMillis?.() ?? 0;

          const bTime =
            b.created_at?.toMillis?.() ?? 0;

          return bTime - aTime;
        });

        setTrips(tripData);

        if (tripId) {
          const found = tripData.find(
            (trip) => trip.id === tripId
          );

          if (found) {
            setSelectedTrip(found);
          }
        } else if (tripData.length > 0) {
          setSelectedTrip((current) => {
            if (current) {
              const updatedTrip =
                tripData.find(
                  (trip) => trip.id === current.id
                );

              return updatedTrip ?? tripData[0];
            }

            return tripData[0];
          });
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "Firebase trips error:",
          error
        );

        toast.error("Failed to load trips");

        setTrips([]);
        setSelectedTrip(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tripId]);

  // ========================================
  // LOAD CHAT HISTORY
  // ========================================

  useEffect(() => {
    if (!selectedTrip?.id || !user) return;

    let cancelled = false;

    const loadChatHistory = async () => {
      try {
        setLoadingMessages(true);

        const data = await listMessages(
          selectedTrip.id
        );

        if (cancelled) return;

        if (data.length > 0) {
          const chatMessages: Msg[] =
            data.map((message: any) => ({
              role:
                message.role === "user"
                  ? "user"
                  : "assistant",
              content: message.content,
            }));

          setMessages(chatMessages);
        } else {
          setMessages([
            {
              role: "assistant",
              content: `Hi! I'm your AI travel assistant for your ${selectedTrip.destination} trip. I can help you modify the itinerary, adjust the budget, add or remove activities, and more. What would you like to do?`,
            },
          ]);
        }
      } catch (error) {
        console.error(
          "Failed to load chat history:",
          error
        );

        setMessages([
          {
            role: "assistant",
            content: `Hi! I'm your AI travel assistant for your ${selectedTrip.destination} trip. What would you like to change?`,
          },
        ]);
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedTrip?.id, user]);

  // ========================================
  // AUTO SCROLL
  // ========================================

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  // ========================================
  // SELECT TRIP
  // ========================================

  const selectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setMessages([]);
  };

  // ========================================
  // SEND MESSAGE
  // ========================================

  const send = async (text: string) => {
    const cleanText = text.trim();

    if (!cleanText) return;

    // ========================================
    // DETECT NEW TRIP REQUEST
    // ========================================

    const lowerText =
      cleanText.toLowerCase();

    const newTripRequest =
      (
        lowerText.includes("new trip") ||
        lowerText.includes("another trip") ||
        lowerText.includes("different trip") ||
        lowerText.includes("new travel") ||
        lowerText.includes("another travel") ||
        lowerText.includes("new journey") ||
        lowerText.includes("another journey") ||
        lowerText.includes("new vacation") ||
        lowerText.includes("another vacation") ||
        lowerText.includes("ek aur trip") ||
        lowerText.includes("ek nayi trip") ||
        lowerText.includes("ek naya trip") ||
        lowerText.includes("nayi trip") ||
        lowerText.includes("naya trip") ||
        lowerText.includes("dusri trip") ||
        lowerText.includes("alag trip")
      ) &&
      (
        lowerText.includes("plan") ||
        lowerText.includes("create") ||
        lowerText.includes("make") ||
        lowerText.includes("start") ||
        lowerText.includes("want") ||
        lowerText.includes("need") ||
        lowerText.includes("kar") ||
        lowerText.includes("chahiye")
      );

    if (newTripRequest) {
      toast.success(
        "Opening AI Trip Planner ✨"
      );

      navigate("/planner");
      return;
    }

    // ========================================
    // CHECK LOGIN
    // ========================================

    if (!user) {
      toast.error(
        "Please login before using AI Chat."
      );
      return;
    }

    // ========================================
    // CHECK SELECTED TRIP
    // ========================================

    if (!selectedTrip?.plan) {
      toast.error(
        "This trip does not have an AI-generated plan yet."
      );
      return;
    }

    if (sending) return;

    const userMsg: Msg = {
      role: "user",
      content: cleanText,
    };

    const updatedHistory = [
      ...messages,
      userMsg,
    ];

    setMessages(updatedHistory);
    setInput("");
    setSending(true);

    try {
      // ========================================
      // SAVE USER MESSAGE
      // ========================================

      await addMessage(
        selectedTrip.id,
        "user",
        cleanText
      );

      // ========================================
      // SEND TO AI
      // ========================================

      const result = await sendChatCommand(
        cleanText,
        selectedTrip.plan,
        updatedHistory
      );

      console.log(
        "AI CHAT RESULT:",
        result
      );

      // ========================================
      // AI RESPONSE
      // ========================================

      const assistantMsg: Msg = {
        role: "assistant",
        content:
          result.reply ||
          "I couldn't generate a response. Please try again.",
      };

      setMessages((prev) => [
        ...prev,
        assistantMsg,
      ]);

      // ========================================
      // SAVE AI RESPONSE
      // ========================================

      await addMessage(
        selectedTrip.id,
        "assistant",
        assistantMsg.content
      );

      // ========================================
      // UPDATE TRIP
      // ========================================

      if (result.updatedPlan) {
        let updatedPlan =
          result.updatedPlan as TravelPlan;

        console.log(
          "AI UPDATED PLAN:",
          updatedPlan
        );

        // ----------------------------------------
        // Calculate new number of days
        // ----------------------------------------

        const updatedDays =
          getPlanDays(
            updatedPlan,
            selectedTrip.days
          );

        console.log(
          "OLD DAYS:",
          selectedTrip.days
        );

        console.log(
          "NEW DAYS:",
          updatedDays
        );

        console.log(
          "UPDATED ITINERARY:",
          (updatedPlan as any).itinerary
        );

        // ----------------------------------------
        // SAVE TO FIREBASE
        // ----------------------------------------

        await updateTrip(
          selectedTrip.id,
          {
            plan: updatedPlan,
            days: updatedDays,
          }
        );

        console.log(
          "Trip update sent to Firebase."
        );

        // ----------------------------------------
        // READ BACK FROM FIREBASE
        // ----------------------------------------

        const savedTrip =
          await getTrip(
            selectedTrip.id
          );

        if (!savedTrip) {
          throw new Error(
            "Trip was updated but could not be loaded again."
          );
        }

        console.log(
          "SAVED TRIP FROM FIREBASE:",
          savedTrip
        );

        // ----------------------------------------
        // Update selected trip with REAL
        // Firebase data
        // ----------------------------------------

        const refreshedTrip =
          savedTrip as Trip;

        setSelectedTrip(
          refreshedTrip
        );

        // ----------------------------------------
        // Update trips list too
        // ----------------------------------------

        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            trip.id === refreshedTrip.id
              ? refreshedTrip
              : trip
          )
        );

        toast.success(
          `Trip updated successfully! ${refreshedTrip.days} days now ✨`
        );
      } else {
        console.log(
          "No updatedPlan received from AI."
        );
      }
    } catch (error) {
      console.error(
        "AI Chat error:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send message";

      toast.error(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // ========================================
  // NO TRIPS
  // ========================================

  if (trips.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold lg:text-3xl">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Chat Assistant
          </h1>

          <p className="mt-1 text-muted-foreground">
            Modify your trip dynamically with natural language
          </p>
        </div>

        <Card className="flex flex-col items-center gap-4 p-12 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>

          <div>
            <p className="font-medium">
              No trips to chat about
            </p>

            <p className="text-sm text-muted-foreground">
              Create a trip first, then come back to chat with the AI
            </p>
          </div>

          <Button
            onClick={() =>
              navigate("/planner")
            }
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Plan a Trip
          </Button>

        </Card>
      </div>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-8">

      {/* HEADER */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold lg:text-3xl">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Chat Assistant
        </h1>

        <p className="mt-1 text-muted-foreground">
          Modify your trip dynamically with natural language
        </p>
      </div>

      {/* TRIP SELECTOR */}
      {trips.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">

          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() =>
                selectTrip(trip)
              }
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                selectedTrip?.id === trip.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {trip.destination}
            </button>
          ))}

        </div>
      )}

      {/* CHAT CARD */}
      <Card className="flex h-[60vh] flex-col overflow-hidden">

        {/* CHAT HEADER */}
        <div className="flex items-center justify-between border-b p-4">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                AI Assistant
              </p>

              <p className="text-xs text-muted-foreground">
                {selectedTrip?.destination}
                {" · "}
                {selectedTrip?.days} days
              </p>
            </div>

          </div>

          {selectedTrip && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/trips/${selectedTrip.id}`
                )
              }
              className="gap-1.5"
            >
              View Trip
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

        </div>

        {/* MESSAGES */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4"
        >

          {loadingMessages ? (
            <div className="space-y-4">

              <div className="flex justify-start">
                <Skeleton className="h-16 w-72 rounded-2xl" />
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-12 w-56 rounded-2xl" />
              </div>

            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={`${i}-${msg.role}`}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* THINKING */}
          {sending && (
            <div className="flex justify-start">

              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5">

                <Loader2 className="h-4 w-4 animate-spin text-primary" />

                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>

              </div>

            </div>
          )}

        </div>

        {/* INPUT AREA */}
        <div className="border-t p-3">

          {/* QUICK COMMANDS */}
          <div className="mb-2 flex flex-wrap gap-1.5">

            {QUICK_COMMANDS.map(
              (command) => (
                <button
                  key={command}
                  type="button"
                  onClick={() =>
                    send(command)
                  }
                  disabled={
                    sending ||
                    loadingMessages
                  }
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {command}
                </button>
              )
            )}

          </div>

          {/* FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >

            <input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              placeholder="Ask me to modify your trip..."
              disabled={
                sending ||
                loadingMessages
              }
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />

            <Button
              type="submit"
              size="icon"
              disabled={
                sending ||
                loadingMessages ||
                !input.trim()
              }
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

          </form>

        </div>

      </Card>
    </div>
  );
}