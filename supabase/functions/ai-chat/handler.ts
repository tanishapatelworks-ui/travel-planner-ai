import type { FullPlan } from "../ai-planner/generator.ts";

export interface ChatRequest {
  message: string;
  plan: FullPlan;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
  updatedPlan?: FullPlan;
}

// Lightweight natural-language command parser that mutates the plan.
export function applyChatCommand(req: ChatRequest): ChatResponse {
  const msg = req.message.toLowerCase().trim();
  const plan: FullPlan = JSON.parse(JSON.stringify(req.plan));

  // Regenerate a specific day
  const regenMatch = msg.match(/regenerate\s+day\s+(\d+)/);
  if (regenMatch) {
    const day = parseInt(regenMatch[1], 10);
    const idx = plan.itinerary.findIndex((d) => d.day === day);
    if (idx >= 0) {
      const themes = ["Discovery & Adventure", "Culture & Cuisine", "Relaxation & Views", "Shopping & Nightlife"];
      const d = plan.itinerary[idx];
      d.theme = themes[(day - 1) % themes.length];
      d.title = `Day ${day} — ${d.theme}`;
      const off = (day - 1) * 2;
      d.morning = { time: "09:00", activity: `Explore ${plan.attractions[off % plan.attractions.length]}`, place: plan.attractions[off % plan.attractions.length], note: "Fresh start with a new perspective." };
      d.afternoon = { time: "14:00", activity: plan.activities[(day - 1) % plan.activities.length], place: plan.attractions[(off + 1) % plan.attractions.length], note: "Hand-picked activity for your interests." };
      d.evening = { time: "19:00", activity: "Sunset spot & local dinner", place: plan.attractions[(off + 2) % plan.attractions.length], note: "End the day with great food and views." };
      return { reply: `Done! I've regenerated Day ${day} with a fresh "${d.theme}" theme and new activities.`, updatedPlan: plan };
    }
    return { reply: `I couldn't find Day ${day} in your itinerary. Your trip has ${plan.itinerary.length} days.` };
  }

  // Add adventure activities
  if (msg.includes("adventure") || msg.includes("add adventure")) {
    const adv = ["Paragliding", "River rafting", "Zip-lining", "ATV ride", "Scuba diving", "Rock climbing"];
    plan.activities = [...plan.activities, ...adv.slice(0, 3)];
    return { reply: "Added 3 adventure activities to your trip: Paragliding, River rafting, and Zip-lining. Your itinerary now includes more thrill!", updatedPlan: plan };
  }

  // Remove museums
  if (msg.includes("remove museum") || msg.includes("no museum")) {
    plan.attractions = plan.attractions.filter((a) => !a.toLowerCase().includes("museum"));
    plan.itinerary = plan.itinerary.map((d) => {
      if (d.morning.place.toLowerCase().includes("museum")) d.morning.place = plan.attractions[0] ?? d.morning.place;
      if (d.afternoon.place.toLowerCase().includes("museum")) d.afternoon.place = plan.attractions[1] ?? d.afternoon.place;
      return d;
    });
    return { reply: "Removed all museums from your itinerary and replaced them with outdoor attractions.", updatedPlan: plan };
  }

  // Family-friendly
  if (msg.includes("family") || msg.includes("kid")) {
    plan.activities = [...plan.activities.filter((a) => !["Casino night", "Scuba diving", "Paragliding"].includes(a)), "Amusement park visit", "Family picnic", "Zoo / aquarium"];
    plan.tips = [{ category: "Family", tip: "Plan breaks between activities; kids tire faster than adults." }, ...plan.tips];
    return { reply: "Adjusted your trip to be family-friendly: removed adult-only activities and added kid-friendly options plus family travel tips.", updatedPlan: plan };
  }

  // Budget adjustment
  const budgetMatch = msg.match(/(?:budget|reduce|increase).*(?:₹|rs|inr)?\s*(\d[\d,]*)/);
  if (budgetMatch) {
    const newBudget = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    const t = newBudget;
    const splits = [
      { category: "Hotel", percentage: 35, color: "#0ea5e9" },
      { category: "Food", percentage: 20, color: "#10b981" },
      { category: "Transport", percentage: 15, color: "#f59e0b" },
      { category: "Activities", percentage: 15, color: "#ef4444" },
      { category: "Shopping", percentage: 10, color: "#8b5cf6" },
      { category: "Emergency Fund", percentage: 5, color: "#ec4899" },
    ];
    plan.budget = splits.map((s) => ({ ...s, amount: Math.round((t * s.percentage) / 100) })) as any;
    return { reply: `Updated your total budget to ₹${newBudget.toLocaleString()} and recalculated the breakdown across all categories.`, updatedPlan: plan };
  }

  // Add more days
  const addDayMatch = msg.match(/add\s+(\d+)\s+day/);
  if (addDayMatch) {
    const n = parseInt(addDayMatch[1], 10);
    const startDay = plan.itinerary.length;
    const themes = ["Discovery & Adventure", "Culture & Cuisine", "Relaxation & Views"];
    for (let i = 0; i < n; i++) {
      const day = startDay + i + 1;
      plan.itinerary.push({
        day,
        title: `Day ${day} — ${themes[i % themes.length]}`,
        theme: themes[i % themes.length],
        morning: { time: "09:00", activity: `Visit ${plan.attractions[(day) % plan.attractions.length]}`, place: plan.attractions[day % plan.attractions.length], note: "Newly added day." },
        afternoon: { time: "14:00", activity: plan.activities[day % plan.activities.length], place: plan.attractions[(day + 1) % plan.attractions.length], note: "Curated activity." },
        evening: { time: "19:00", activity: "Local dinner & stroll", place: plan.attractions[(day + 2) % plan.attractions.length], note: "Relaxing evening." },
        meals: { breakfast: plan.localFood[day % plan.localFood.length], lunch: plan.localFood[(day + 1) % plan.localFood.length], dinner: plan.localFood[(day + 2) % plan.localFood.length] },
      });
    }
    return { reply: `Added ${n} day${n > 1 ? "s" : ""} to your trip. It's now ${plan.itinerary.length} days long.`, updatedPlan: plan };
  }

  // Default helpful response
  return {
    reply: `I can help with your ${plan.destination} trip! Try: "Regenerate Day 2", "Add adventure activities", "Remove museums", "Make it family-friendly", "Budget ₹30000", or "Add 2 days".`,
  };
}
