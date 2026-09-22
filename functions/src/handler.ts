export interface ChatRequest {
  message: string;
  plan: any;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  reply: string;
  updatedPlan?: any;
}

export function applyChatCommand(req: ChatRequest): ChatResponse {
  const msg = req.message.toLowerCase().trim();

  const plan = JSON.parse(JSON.stringify(req.plan));

  // -----------------------------
  // Regenerate / update a day
  // -----------------------------
  const regenMatch = msg.match(
    /(?:regenerate|redo|change|update)\s+(?:day|din)\s*(\d+)/i
  );

  if (regenMatch) {
    const day = parseInt(regenMatch[1], 10);
    const idx = plan.itinerary?.findIndex(
      (d: any) => d.day === day
    );

    if (idx >= 0) {
      const themes = [
        "Discovery & Adventure",
        "Culture & Cuisine",
        "Relaxation & Views",
        "Shopping & Nightlife",
      ];

      const d = plan.itinerary[idx];

      d.theme = themes[(day - 1) % themes.length];
      d.title = `Day ${day} — ${d.theme}`;

      const attractions = plan.attractions || [];
      const activities = plan.activities || [];

      if (attractions.length > 0) {
        const off = (day - 1) * 2;

        d.morning = {
          time: "09:00",
          activity: `Explore ${
            attractions[off % attractions.length]
          }`,
          place: attractions[off % attractions.length],
          note: "Fresh start with a new perspective.",
        };

        d.afternoon = {
          time: "14:00",
          activity:
            activities[(day - 1) % Math.max(activities.length, 1)] ||
            "Explore local attractions",
          place:
            attractions[(off + 1) % attractions.length],
          note: "Hand-picked activity for your interests.",
        };

        d.evening = {
          time: "19:00",
          activity: "Sunset spot & local dinner",
          place:
            attractions[(off + 2) % attractions.length],
          note: "End the day with great food and views.",
        };
      }

      return {
        reply: `Done! I've regenerated Day ${day} with a fresh "${d.theme}" theme and new activities.`,
        updatedPlan: plan,
      };
    }

    return {
      reply: `I couldn't find Day ${day} in your itinerary. Your trip has ${
        plan.itinerary?.length || 0
      } days.`,
    };
  }

  // -----------------------------
  // Add adventure activities
  // -----------------------------
  if (
    msg.includes("adventure") ||
    msg.includes("adventurous")
  ) {
    const adv = [
      "Paragliding",
      "River rafting",
      "Zip-lining",
    ];

    plan.activities = [
      ...(plan.activities || []),
      ...adv.filter(
        (item) => !(plan.activities || []).includes(item)
      ),
    ];

    return {
      reply:
        "Done! I've added adventure activities to your trip: Paragliding, River rafting, and Zip-lining.",
      updatedPlan: plan,
    };
  }

  // -----------------------------
  // Remove museums
  // -----------------------------
  if (
    msg.includes("remove museum") ||
    msg.includes("remove museums") ||
    msg.includes("no museum") ||
    msg.includes("museum hata") ||
    msg.includes("museum mat")
  ) {
    plan.attractions = (plan.attractions || []).filter(
      (a: string) =>
        !a.toLowerCase().includes("museum")
    );

    return {
      reply:
        "Done! I've removed museums from your trip.",
      updatedPlan: plan,
    };
  }

  // -----------------------------
  // Family friendly
  // -----------------------------
  if (
    msg.includes("family") ||
    msg.includes("family-friendly") ||
    msg.includes("kids") ||
    msg.includes("kid friendly")
  ) {
    const removeActivities = [
      "Casino night",
      "Scuba diving",
      "Paragliding",
    ];

    plan.activities = [
      ...(plan.activities || []).filter(
        (a: string) =>
          !removeActivities.includes(a)
      ),
      "Amusement park visit",
      "Family picnic",
      "Zoo / aquarium",
    ];

    plan.tips = [
      {
        category: "Family",
        tip: "Plan breaks between activities; kids tire faster than adults.",
      },
      ...(plan.tips || []),
    ];

    return {
      reply:
        "Done! I've adjusted your trip to be more family-friendly.",
      updatedPlan: plan,
    };
  }

  // -----------------------------
  // Budget
  // -----------------------------
  const budgetMatch = msg.match(
    /(?:budget|reduce|increase|budget\s*ko).*?(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i
  );

  if (budgetMatch) {
    const newBudget = parseInt(
      budgetMatch[1].replace(/,/g, ""),
      10
    );

    const splits = [
      {
        category: "Hotel",
        percentage: 35,
        color: "#0ea5e9",
      },
      {
        category: "Food",
        percentage: 20,
        color: "#10b981",
      },
      {
        category: "Transport",
        percentage: 15,
        color: "#f59e0b",
      },
      {
        category: "Activities",
        percentage: 15,
        color: "#ef4444",
      },
      {
        category: "Shopping",
        percentage: 10,
        color: "#8b5cf6",
      },
      {
        category: "Emergency Fund",
        percentage: 5,
        color: "#ec4899",
      },
    ];

    plan.budget = splits.map((item) => ({
      ...item,
      amount: Math.round(
        (newBudget * item.percentage) / 100
      ),
    }));

    plan.budget_total = newBudget;

    return {
      reply: `Done! I've updated your total budget to ₹${newBudget.toLocaleString()} and recalculated the budget breakdown.`,
      updatedPlan: plan,
    };
  }

  // -----------------------------
  // ADD DAYS
  // Supports:
  //
  // Add 4 days
  // Add 4 more days
  // Goa trip me 4 days badha do
  // goa ka trip me 4 days badhado
  // 4 days add karo
  // 4 din badha do
  // -----------------------------

  const addDayPatterns = [
    /(?:add|increase|extend)\s+(\d+)\s*(?:more\s*)?(?:day|days|din)/i,

    /(\d+)\s*(?:more\s*)?(?:day|days|din).*?(?:add|increase|extend|badha|badh|karo|karna|chahiye)/i,

    /(?:trip|travel|journey).*?(\d+)\s*(?:more\s*)?(?:day|days|din).*?(?:add|increase|extend|badha|badh)/i,

    /(\d+)\s*(?:day|days|din).*?(?:badha|badh)[a-z]*/i,
  ];

  let daysToAdd: number | null = null;

  for (const pattern of addDayPatterns) {
    const match = msg.match(pattern);

    if (match) {
      daysToAdd = parseInt(match[1], 10);
      break;
    }
  }

  if (daysToAdd !== null && daysToAdd > 0) {
    const attractions = plan.attractions || [];
    const activities = plan.activities || [];
    const localFood = plan.localFood || [];

    if (!plan.itinerary) {
      plan.itinerary = [];
    }

    const startDay = plan.itinerary.length;

    const themes = [
      "Discovery & Adventure",
      "Culture & Cuisine",
      "Relaxation & Views",
      "Shopping & Nightlife",
    ];

    for (let i = 0; i < daysToAdd; i++) {
      const day = startDay + i + 1;

      const theme =
        themes[i % themes.length];

      const attraction1 =
        attractions.length > 0
          ? attractions[
              day % attractions.length
            ]
          : "Local sightseeing";

      const attraction2 =
        attractions.length > 0
          ? attractions[
              (day + 1) % attractions.length
            ]
          : "Popular local attraction";

      const attraction3 =
        attractions.length > 0
          ? attractions[
              (day + 2) % attractions.length
            ]
          : "Local market";

      const activity =
        activities.length > 0
          ? activities[
              day % activities.length
            ]
          : "Explore the destination";

      const breakfast =
        localFood.length > 0
          ? localFood[
              day % localFood.length
            ]
          : "Local breakfast";

      const lunch =
        localFood.length > 0
          ? localFood[
              (day + 1) % localFood.length
            ]
          : "Local lunch";

      const dinner =
        localFood.length > 0
          ? localFood[
              (day + 2) % localFood.length
            ]
          : "Local dinner";

      plan.itinerary.push({
        day,
        title: `Day ${day} — ${theme}`,
        theme,

        morning: {
          time: "09:00",
          activity: `Visit ${attraction1}`,
          place: attraction1,
          note: "Newly added day.",
        },

        afternoon: {
          time: "14:00",
          activity,
          place: attraction2,
          note: "Curated activity based on your trip.",
        },

        evening: {
          time: "19:00",
          activity: "Local dinner & evening stroll",
          place: attraction3,
          note: "Relaxing evening.",
        },

        meals: {
          breakfast,
          lunch,
          dinner,
        },
      });
    }

    plan.days = plan.itinerary.length;

    return {
      reply: `Done! I've added ${daysToAdd} day${
        daysToAdd > 1 ? "s" : ""
      } to your ${plan.destination || "trip"} trip. Your trip is now ${
        plan.itinerary.length
      } days long.`,
      updatedPlan: plan,
    };
  }

  // -----------------------------
  // Default response
  // -----------------------------

  return {
    reply: `I can help modify your ${
      plan.destination || "trip"
    } trip. Try commands like "Add 4 days", "4 din badha do", "Add adventure activities", "Remove museums", "Make it family-friendly", "Budget ₹30000", or "Regenerate Day 2".`,
  };
}