import { supabase } from "./supabase";
import type { TravelPlan } from "@/types";

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const headers = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
});

export interface PlannerInput {
  destination: string;
  days: number;
  budgetTotal: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  interests?: string[];
  transport?: string;
}

export async function generateTravelPlan(input: PlannerInput): Promise<TravelPlan> {
  const res = await fetch(`${EDGE_BASE}/ai-planner`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Planner failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.plan) throw new Error("No plan returned");
  return data.plan as TravelPlan;
}

export async function sendChatCommand(
  message: string,
  plan: TravelPlan,
  history: { role: string; content: string }[] = [],
): Promise<{ reply: string; updatedPlan?: TravelPlan }> {
  const res = await fetch(`${EDGE_BASE}/ai-chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message, plan, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Chat failed (${res.status})`);
  }
  const data = await res.json();
  return { reply: data.reply, updatedPlan: data.updatedPlan };
}

export async function getWeather(
  destination: string,
  days = 7,
): Promise<{ destination: string; forecast: import("@/types").WeatherForecastDay[] }> {
  const res = await fetch(`${EDGE_BASE}/weather`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ destination, days }),
  });
  if (!res.ok) throw new Error(`Weather failed (${res.status})`);
  return res.json();
}

// ---- Trips CRUD ----

export async function saveTrip(payload: Partial<import("@/types").Trip> & { plan: TravelPlan }) {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      title: payload.title,
      destination: payload.destination,
      budget_total: payload.budget_total,
      currency: payload.currency ?? "INR",
      days: payload.days,
      start_date: payload.start_date,
      end_date: payload.end_date,
      travelers: payload.travelers,
      interests: payload.interests ?? [],
      transport: payload.transport ?? "Mixed",
      status: payload.status ?? "planned",
      plan: payload.plan,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTrip(id: string, patch: Partial<import("@/types").Trip>) {
  const { data, error } = await supabase.from("trips").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string) {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function listTrips() {
  const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTrip(id: string) {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Chat messages ----

export async function listMessages(tripId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMessage(tripId: string, role: "user" | "assistant", content: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ trip_id: tripId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Profile ----

export async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(patch: Partial<import("@/types").Profile>) {
  const { data, error } = await supabase.from("profiles").update(patch).select().maybeSingle();
  if (error) throw error;
  return data;
}
