import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import type { TravelPlan } from "@/types";

// --------------------------------------------------
// AI FUNCTIONS
// --------------------------------------------------

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

// --------------------------------------------------
// AI TRAVEL PLANNER
// Still using existing Supabase AI Planner
// --------------------------------------------------

export async function generateTravelPlan(
  input: PlannerInput
): Promise<TravelPlan> {
  const res = await fetch(`${EDGE_BASE}/ai-planner`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error || `Planner failed (${res.status})`
    );
  }

  const data = await res.json();

  if (!data.plan) {
    throw new Error("No plan returned");
  }

  return data.plan as TravelPlan;
}

// --------------------------------------------------
// AI CHAT
// Google Apps Script + Gemini
// --------------------------------------------------

export async function sendChatCommand(
  message: string,
  plan: TravelPlan,
  history: { role: string; content: string }[] = []
): Promise<{
  reply: string;
  updatedPlan?: TravelPlan;
}> {
  const res = await fetch(
    "https://script.google.com/macros/s/AKfycbxa72SI-D1-A_ht0JS50_13mTR_HXwvqPt2NAszUfxlhHSKCmSSM69Wwt0tpZEMZ9li5w/exec",
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        message,
        plan,
        history,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error || `Chat failed (${res.status})`
    );
  }

  return {
    reply: data.reply,
    updatedPlan: data.updatedPlan,
  };
}

// --------------------------------------------------
// WEATHER
// Still using existing Supabase Weather function
// --------------------------------------------------

export async function getWeather(
  destination: string,
  days = 7
): Promise<{
  destination: string;
  forecast: import("@/types").WeatherForecastDay[];
}> {
  const res = await fetch(`${EDGE_BASE}/weather`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      destination,
      days,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Weather failed (${res.status})`
    );
  }

  return res.json();
}

// --------------------------------------------------
// TRIPS CRUD - FIREBASE FIRESTORE
// --------------------------------------------------

export async function saveTrip(
  payload: Partial<import("@/types").Trip> & {
    plan: TravelPlan;
  }
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to save a trip."
    );
  }

  const tripData = {
    userId: user.uid,
    title: payload.title ?? "",
    destination: payload.destination ?? "",
    budget_total: payload.budget_total ?? 0,
    currency: payload.currency ?? "INR",
    days: payload.days ?? 1,
    start_date: payload.start_date ?? null,
    end_date: payload.end_date ?? null,
    travelers: payload.travelers ?? 1,
    interests: payload.interests ?? [],
    transport: payload.transport ?? "Mixed",
    status: payload.status ?? "planned",
    plan: payload.plan,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, "trips"),
    tripData
  );

  return {
    id: docRef.id,
    ...tripData,
  };
}

// --------------------------------------------------
// UPDATE TRIP
// --------------------------------------------------

export async function updateTrip(
  id: string,
  patch: Partial<import("@/types").Trip>
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to update a trip."
    );
  }

  const tripRef = doc(db, "trips", id);

  const tripSnap = await getDoc(tripRef);

  if (!tripSnap.exists()) {
    throw new Error("Trip not found.");
  }

  if (
    tripSnap.data().userId !== user.uid
  ) {
    throw new Error(
      "You are not allowed to update this trip."
    );
  }

  await updateDoc(tripRef, {
    ...patch,
    updated_at: serverTimestamp(),
  });

  const updatedSnap = await getDoc(tripRef);

  return {
    id: updatedSnap.id,
    ...updatedSnap.data(),
  };
}

// --------------------------------------------------
// DELETE TRIP
// --------------------------------------------------

export async function deleteTrip(id: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to delete a trip."
    );
  }

  const tripRef = doc(db, "trips", id);

  const tripSnap = await getDoc(tripRef);

  if (!tripSnap.exists()) {
    throw new Error("Trip not found.");
  }

  if (
    tripSnap.data().userId !== user.uid
  ) {
    throw new Error(
      "You are not allowed to delete this trip."
    );
  }

  await deleteDoc(tripRef);
}

// --------------------------------------------------
// LIST TRIPS
// --------------------------------------------------

export async function listTrips() {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  const tripsQuery = query(
    collection(db, "trips"),
    where("userId", "==", user.uid),
    orderBy("created_at", "desc")
  );

  const snapshot = await getDocs(
    tripsQuery
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// --------------------------------------------------
// GET SINGLE TRIP
// --------------------------------------------------

export async function getTrip(id: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to view your trip."
    );
  }

  const tripRef = doc(db, "trips", id);

  const tripSnap = await getDoc(tripRef);

  if (!tripSnap.exists()) {
    return null;
  }

  const data = tripSnap.data();

  if (data.userId !== user.uid) {
    throw new Error(
      "You are not allowed to view this trip."
    );
  }

  return {
    id: tripSnap.id,
    ...data,
  };
}

// --------------------------------------------------
// CHAT MESSAGES - FIREBASE FIRESTORE
// --------------------------------------------------

export async function listMessages(
  tripId: string
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to view messages."
    );
  }

  const messagesQuery = query(
    collection(db, "chat_messages"),
    where("tripId", "==", tripId),
    where("userId", "==", user.uid),
    orderBy("created_at", "asc")
  );

  const snapshot = await getDocs(
    messagesQuery
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// --------------------------------------------------
// ADD CHAT MESSAGE
// --------------------------------------------------

export async function addMessage(
  tripId: string,
  role: "user" | "assistant",
  content: string
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to send messages."
    );
  }

  const messageData = {
    tripId,
    userId: user.uid,
    role,
    content,
    created_at: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, "chat_messages"),
    messageData
  );

  return {
    id: docRef.id,
    ...messageData,
  };
}

// --------------------------------------------------
// PROFILE - FIREBASE FIRESTORE
// --------------------------------------------------

export async function getProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to view your profile."
    );
  }

  const profileRef = doc(
    db,
    "users",
    user.uid
  );

  const profileSnap = await getDoc(
    profileRef
  );

  if (!profileSnap.exists()) {
    return null;
  }

  return {
    id: profileSnap.id,
    ...profileSnap.data(),
  };
}

// --------------------------------------------------
// UPDATE PROFILE
// --------------------------------------------------

export async function updateProfile(
  patch: Partial<import("@/types").Profile>
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to update your profile."
    );
  }

  const profileRef = doc(
    db,
    "users",
    user.uid
  );

  await updateDoc(profileRef, {
    ...patch,
    updated_at: serverTimestamp(),
  });

  const updatedSnap = await getDoc(
    profileRef
  );

  return {
    id: updatedSnap.id,
    ...updatedSnap.data(),
  };
}