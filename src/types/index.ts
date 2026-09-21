export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  preferred_budget: string | null;
  preferred_destinations: string[];
  travel_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  budget_total: number;
  currency: string;
  days: number;
  start_date: string | null;
  end_date: string | null;
  travelers: number;
  interests: string[];
  transport: string;
  status: "planned" | "upcoming" | "completed";
  is_favorite: boolean;
  plan: TravelPlan;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  theme: string;
  morning: { time: string; activity: string; place: string; note: string };
  afternoon: { time: string; activity: string; place: string; note: string };
  evening: { time: string; activity: string; place: string; note: string };
  meals: { breakfast: string; lunch: string; dinner: string };
}

export interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface HotelSuggestion {
  name: string;
  tier: string;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  reason: string;
}

export interface TransportSuggestion {
  mode: string;
  type: string;
  estimatedCost: number;
  duration: string;
  notes: string;
}

export interface PackingItem {
  category: string;
  item: string;
  essential: boolean;
}

export interface TravelTip {
  category: string;
  tip: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
  note: string;
}

export interface TravelPlan {
  destination: string;
  summary: string;
  itinerary: ItineraryDay[];
  attractions: string[];
  localFood: string[];
  activities: string[];
  budget: BudgetItem[];
  hotels: HotelSuggestion[];
  transport: TransportSuggestion[];
  packing: PackingItem[];
  tips: TravelTip[];
  emergency: EmergencyContact[];
  weather: { condition: string; tempRange: string; advice: string };
}

export interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  humidity: number;
  wind: number;
}
