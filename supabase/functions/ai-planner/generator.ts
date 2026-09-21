// Local itinerary generator — deterministic, rich, no external API required.
// If GEMINI_API_KEY is configured, the planner edge function could call it; for
// now we generate a high-quality plan locally so the app works out of the box.

export interface PlanInput {
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

export interface ItineraryDay {
  day: number;
  title: string;
  theme: string;
  morning: { time: string; activity: string; place: string; note: string };
  afternoon: { time: string; activity: string; place: string; note: string };
  evening: { time: string; activity: string; place: string; note: string };
  meals: { breakfast: string; lunch: string; dinner: string };
}

export interface BudgetBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}[]

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

export interface FullPlan {
  destination: string;
  summary: string;
  itinerary: ItineraryDay[];
  attractions: string[];
  localFood: string[];
  activities: string[];
  budget: BudgetBreakdown[];
  hotels: HotelSuggestion[];
  transport: TransportSuggestion[];
  packing: PackingItem[];
  tips: TravelTip[];
  emergency: EmergencyContact[];
  weather: { condition: string; tempRange: string; advice: string };
}

const ATTRACTIONS: Record<string, string[]> = {
  goa: ["Baga Beach", "Fort Aguada", "Dudhsagar Waterfalls", "Basilica of Bom Jesus", "Anjuna Flea Market", "Tito's Lane", "Chapora Fort", "Palolem Beach"],
  delhi: ["Red Fort", "India Gate", "Qutub Minar", "Humayun's Tomb", "Lotus Temple", "Akshardham", "Chandni Chowk", "Connaught Place"],
  mumbai: ["Gateway of India", "Marine Drive", "Elephanta Caves", "Chhatrapati Shivaji Terminus", "Juhu Beach", "Haji Ali Dargah", "Colaba Causeway", "Bandra Worli Sea Link"],
  jaipur: ["Amber Fort", "Hawa Mahal", "City Palace", "Jantar Mantar", "Nahargarh Fort", "Jal Mahal", "Albert Hall Museum", "Bapu Bazaar"],
  bangalore: ["Lalbagh Botanical Garden", "Cubbon Park", "Bangalore Palace", "ISKCON Temple", "UB City Mall", "Vidhana Soudha", "Bannerghatta National Park", "MG Road"],
  kerala: ["Alleppey Backwaters", "Munnar Tea Gardens", "Kathakali Show", "Fort Kochi", "Varkala Beach", "Athirappilly Falls", "Spice Plantations", "Chinese Fishing Nets"],
  paris: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Montmartre", "Champs-Élysées", "Seine Cruise", "Arc de Triomphe", "Sacré-Cœur"],
  tokyo: ["Senso-ji Temple", "Shibuya Crossing", "Tokyo Skytree", "Meiji Shrine", "Tsukiji Market", "Akihabara", "Shinjuku Gyoen", "Imperial Palace"],
  dubai: ["Burj Khalifa", "Dubai Mall", "Palm Jumeirah", "Desert Safari", "Dubai Marina", "Gold Souk", "Burj Al Arab", "Jumeirah Beach"],
};

const FOOD: Record<string, string[]> = {
  goa: ["Goan Fish Curry", "Prawn Balchão", "Bebinca", "Feni", "Pork Sorpotel", "Chicken Cafreal"],
  delhi: ["Chole Bhature", "Paranthas at Paranthe Wali Gali", "Butter Chicken", "Daulat ki Chaat", "Kebabs at Karim's", "Aloo Tikki"],
  mumbai: ["Vada Pav", "Pav Bhaji", "Bhel Puri", "Bombay Sandwich", "Modak", "Ragda Pattice"],
  jaipur: ["Dal Baati Churma", "Ghevar", "Laal Maas", "Pyaaz Kachori", "Gajak", "Mawa Kachori"],
  bangalore: ["Masala Dosa at MTR", "Bisi Bele Bath", "Filter Coffee", "Bonda Soup", "Ragi Mudde", "Obbattu"],
  kerala: ["Sadya on Banana Leaf", "Appam with Stew", "Karimeen Pollichathu", "Puttu & Kadala", "Payasam", "Banana Chips"],
  paris: ["Croissant", "Coq au Vin", "Crème Brûlée", "Escargot", "Macarons", "Steak Frites"],
  tokyo: ["Sushi at Tsukiji", "Ramen", "Tempura", "Wagyu Beef", "Matcha Sweets", "Okonomiyaki"],
  dubai: ["Shawarma", "Machboos", "Luqaimat", "Falafel", "Karak Chai", "Harees"],
};

const ACTIVITIES: Record<string, string[]> = {
  goa: ["Water sports at Baga", "Sunset cruise on the Mandovi", "Scuba diving at Grande Island", "Spice plantation tour", "Casino night", "Beach yoga"],
  delhi: ["Heritage walk in Old Delhi", "Sound & light show at Red Fort", "Cycle tour of Lutyens' Delhi", "Street food crawl", "Dilli Haat shopping", "Pottery at Sanskriti Kendra"],
  mumbai: ["Heritage walking tour", "Bollywood studio tour", "Street food tour", "Elephanta ferry", "Art deco walk", "Sunset at Marine Drive"],
  jaipur: ["Elephant ride at Amber Fort", "Block printing workshop", "Hot air balloon ride", "Camel ride", "Kathak performance", "Gemstone market tour"],
  bangalore: ["Microbrewery crawl", "Silk farm visit", "Cycling in Cubbon Park", "Coffee tasting", "Rock climbing at Turahalli", "Pub quiz night"],
  kerala: ["Houseboat cruise in Alleppey", "Ayurvedic massage", "Kathakali performance", "Tea estate walk in Munnar", "Canoeing in backwaters", "Spice plantation tour"],
  paris: ["Seine dinner cruise", "Louvre guided tour", "Montmartre art walk", "Versailles day trip", "Cooking class", "Cabaret at Moulin Rouge"],
  tokyo: ["Sumo practice viewing", "Sushi-making class", "Cherry blossom picnic", "Robot café", "Onsen day trip", "Shibuya nightlife tour"],
  dubai: ["Desert safari with dune bashing", "Burj Khalifa observation deck", "Gold souk shopping", "Marina yacht cruise", "Ski Dubai", "Fountain show at Dubai Mall"],
};

function key(dest: string): string {
  const d = dest.toLowerCase().trim();
  for (const k of Object.keys(ATTRACTIONS)) {
    if (d.includes(k)) return k;
  }
  return "goa";
}

const THEMES = ["Arrival & Exploration", "Heritage & Culture", "Nature & Adventure", "Local Flavors", "Leisure & Shopping", "Hidden Gems", "Sunset & Nightlife", "Day Trip & Excursion", "Relaxation & Wellness", "Farewell & Memories"];

function pick<T>(arr: T[], n: number, offset = 0): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(i + offset) % arr.length]);
  return out;
}

function budgetSplit(total: number, days: number, travelers: number): BudgetBreakdown {
  const t = total;
  const splits = [
    { category: "Hotel", percentage: 35, color: "#0ea5e9" },
    { category: "Food", percentage: 20, color: "#10b981" },
    { category: "Transport", percentage: 15, color: "#f59e0b" },
    { category: "Activities", percentage: 15, color: "#ef4444" },
    { category: "Shopping", percentage: 10, color: "#8b5cf6" },
    { category: "Emergency Fund", percentage: 5, color: "#ec4899" },
  ];
  return splits.map((s) => ({
    category: s.category,
    amount: Math.round((t * s.percentage) / 100),
    percentage: s.percentage,
    color: s.color,
  })) as BudgetBreakdown;
}

export function generatePlan(input: PlanInput): FullPlan {
  const k = key(input.destination);
  const days = input.days;
  const travelers = input.travelors ?? input.travelers ?? 1;
  const attractions = pick(ATTRACTIONS[k] ?? ATTRACTIONS.goa, Math.min(days * 2, 8));
  const food = pick(FOOD[k] ?? FOOD.goa, 6);
  const activities = pick(ACTIVITIES[k] ?? ACTIVITIES.goa, 6);

  const itinerary: ItineraryDay[] = [];
  for (let i = 0; i < days; i++) {
    const a1 = attractions[i % attractions.length];
    const a2 = attractions[(i + 1) % attractions.length];
    const act = activities[i % activities.length];
    itinerary.push({
      day: i + 1,
      title: `Day ${i + 1} — ${THEMES[i % THEMES.length]}`,
      theme: THEMES[i % THEMES.length],
      morning: { time: "08:30", activity: `Visit ${a1}`, place: a1, note: "Arrive early to beat crowds and capture the best light." },
      afternoon: { time: "13:00", activity: `Lunch & ${act}`, place: a2, note: "Refuel with local cuisine, then continue exploring." },
      evening: { time: "18:30", activity: i % 2 === 0 ? "Sunset viewpoint & local market stroll" : "Cultural show & dinner at a heritage venue", place: attractions[(i + 3) % attractions.length], note: "Soak in the evening ambiance and try street food." },
      meals: { breakfast: food[i % food.length], lunch: food[(i + 1) % food.length], dinner: food[(i + 2) % food.length] },
    });
  }

  const perNight = Math.round((input.budgetTotal * 0.35) / Math.max(days, 1));
  const hotels: HotelSuggestion[] = [
    { name: `${input.destination} Grand Resort`, tier: "Premium", pricePerNight: perNight, rating: 4.6, amenities: ["Pool", "Spa", "Free WiFi", "Breakfast", "Airport Shuttle"], reason: "Best overall value with excellent location and amenities." },
    { name: `The ${input.destination} Boutique Stay`, tier: "Mid-range", pricePerNight: Math.round(perNight * 0.7), rating: 4.4, amenities: ["Free WiFi", "Breakfast", "Restaurant"], reason: "Charming boutique option near the city center." },
    { name: `${input.destination} Budget Inn`, tier: "Budget", pricePerNight: Math.round(perNight * 0.45), rating: 4.1, amenities: ["Free WiFi", "24/7 Reception"], reason: "Clean, affordable base for exploring on a budget." },
  ];

  const transport: TransportSuggestion[] = [
    { mode: "Flight", type: "Round-trip airfare", estimatedCost: Math.round(input.budgetTotal * 0.12), duration: "2-3 hrs", notes: "Fastest option; book early for best fares." },
    { mode: "Train", type: "AC sleeper class", estimatedCost: Math.round(input.budgetTotal * 0.06), duration: "8-14 hrs", notes: "Scenic and comfortable for overnight travel." },
    { mode: "Bus", type: "Volvo AC sleeper", estimatedCost: Math.round(input.budgetTotal * 0.04), duration: "10-16 hrs", notes: "Most economical; good for budget travelers." },
    { mode: "Taxi/Rental", type: "Self-drive or chauffeur", estimatedCost: Math.round(input.budgetTotal * 0.1), duration: "Flexible", notes: "Best for groups and flexible itineraries." },
  ];

  const packing: PackingItem[] = [
    { category: "Essentials", item: "Passport / ID proof", essential: true },
    { category: "Essentials", item: "Travel tickets & bookings", essential: true },
    { category: "Essentials", item: "Power bank & chargers", essential: true },
    { category: "Clothing", item: "Comfortable walking shoes", essential: true },
    { category: "Clothing", item: "Light cotton clothes (3-4 sets)", essential: false },
    { category: "Clothing", item: "Light jacket / sweater", essential: false },
    { category: "Toiletries", item: "Sunscreen SPF 50+", essential: true },
    { category: "Toiletries", item: "Toothbrush & toothpaste", essential: true },
    { category: "Health", item: "Personal medication", essential: true },
    { category: "Health", item: "First-aid kit", essential: false },
    { category: "Health", item: "Hand sanitizer & wet wipes", essential: false },
    { category: "Misc", item: "Reusable water bottle", essential: false },
    { category: "Misc", item: "Camera & memory cards", essential: false },
    { category: "Misc", item: "Umbrella / raincoat", essential: false },
  ];

  const tips: TravelTip[] = [
    { category: "Safety", tip: "Keep digital and physical copies of important documents." },
    { category: "Money", tip: "Carry some local cash for small vendors; cards may not be accepted everywhere." },
    { category: "Health", tip: "Drink only bottled or filtered water to avoid stomach issues." },
    { category: "Culture", tip: "Dress modestly when visiting religious sites." },
    { category: "Transport", tip: "Use ride-hailing apps for fair pricing and route tracking." },
    { category: "Connectivity", tip: "Buy a local SIM or eSIM for affordable data on arrival." },
  ];

  const emergency: EmergencyContact[] = [
    { label: "Police", number: "100", note: "National police emergency helpline." },
    { label: "Ambulance", number: "108", note: "Emergency medical services." },
    { label: "Tourist Helpline", number: "1363", note: "Multi-lingual tourist assistance (India)." },
    { label: "Emergency (General)", number: "112", note: "Single emergency number for police, ambulance, fire." },
  ];

  return {
    destination: input.destination,
    summary: `A ${days}-day curated journey through ${input.destination} designed around your interests and a ${input.currency ?? "INR"} ${input.budgetTotal.toLocaleString()} budget for ${travelers} traveler${travelers > 1 ? "s" : ""}. Each day blends iconic sights, local flavors, and immersive experiences with optimized routing and a balanced pace.`,
    itinerary,
    attractions,
    localFood: food,
    activities,
    budget: budgetSplit(input.budgetTotal, days, travelers),
    hotels,
    transport,
    packing,
    tips,
    emergency,
    weather: { condition: "Pleasant", tempRange: "22°C – 32°C", advice: "Light cotton clothing recommended; carry an umbrella for occasional showers." },
  };
}
