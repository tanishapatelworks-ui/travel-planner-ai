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

export function applyChatCommand(req: ChatRequest): ChatResponse {
  const msg = req.message.toLowerCase().trim();

  const plan: FullPlan = JSON.parse(
    JSON.stringify(req.plan)
  );

  // ============================================
  // REGENERATE A SPECIFIC DAY
  // ============================================
  const regenMatch = msg.match(
    /(?:regenerate|redo|change|update)\s+(?:day|day no\.?|day number)?\s*(\d+)/i
  );

  if (regenMatch) {
    const day = parseInt(regenMatch[1], 10);

    const idx = plan.itinerary.findIndex(
      (d) => d.day === day
    );

    if (idx >= 0) {
      const themes = [
        "Discovery & Adventure",
        "Culture & Cuisine",
        "Relaxation & Views",
        "Shopping & Nightlife",
      ];

      const d = plan.itinerary[idx];

      d.theme =
        themes[(day - 1) % themes.length];

      d.title = `Day ${day} — ${d.theme}`;

      const attractionCount =
        plan.attractions.length;

      const activityCount =
        plan.activities.length;

      const off = (day - 1) * 2;

      d.morning = {
        time: "09:00",
        activity: `Explore ${
          plan.attractions[
            off % attractionCount
          ]
        }`,
        place:
          plan.attractions[
            off % attractionCount
          ],
        note:
          "Fresh start with a new perspective.",
      };

      d.afternoon = {
        time: "14:00",
        activity:
          plan.activities[
            (day - 1) % activityCount
          ],
        place:
          plan.attractions[
            (off + 1) % attractionCount
          ],
        note:
          "Hand-picked activity for your interests.",
      };

      d.evening = {
        time: "19:00",
        activity:
          "Sunset spot & local dinner",
        place:
          plan.attractions[
            (off + 2) % attractionCount
          ],
        note:
          "End the day with great food and views.",
      };

      return {
        reply: `Done! I've regenerated Day ${day} with a fresh "${d.theme}" theme and new activities.`,
        updatedPlan: plan,
      };
    }

    return {
      reply: `I couldn't find Day ${day} in your itinerary. Your trip has ${plan.itinerary.length} days.`,
    };
  }

  // ============================================
  // ADD ADVENTURE ACTIVITIES
  // ============================================
  if (
    msg.includes("adventure") ||
    msg.includes("add adventure") ||
    msg.includes("adventure activities")
  ) {
    const adv = [
      "Paragliding",
      "River rafting",
      "Zip-lining",
      "ATV ride",
      "Scuba diving",
      "Rock climbing",
    ];

    const newActivities = adv.filter(
      (activity) =>
        !plan.activities.includes(activity)
    );

    plan.activities = [
      ...plan.activities,
      ...newActivities.slice(0, 3),
    ];

    return {
      reply:
        "Added 3 adventure activities to your trip: Paragliding, River rafting, and Zip-lining. Your itinerary now includes more thrill!",
      updatedPlan: plan,
    };
  }

  // ============================================
  // REMOVE MUSEUMS
  // ============================================
  if (
    msg.includes("remove museum") ||
    msg.includes("remove museums") ||
    msg.includes("no museum") ||
    msg.includes("museums hata") ||
    msg.includes("museum hata")
  ) {
    plan.attractions =
      plan.attractions.filter(
        (a) =>
          !a
            .toLowerCase()
            .includes("museum")
      );

    plan.itinerary =
      plan.itinerary.map((d) => {
        if (
          d.morning.place
            .toLowerCase()
            .includes("museum")
        ) {
          d.morning.place =
            plan.attractions[0] ??
            d.morning.place;
        }

        if (
          d.afternoon.place
            .toLowerCase()
            .includes("museum")
        ) {
          d.afternoon.place =
            plan.attractions[1] ??
            d.afternoon.place;
        }

        if (
          d.evening.place
            .toLowerCase()
            .includes("museum")
        ) {
          d.evening.place =
            plan.attractions[2] ??
            d.evening.place;
        }

        return d;
      });

    return {
      reply:
        "Removed all museums from your itinerary and replaced them with other attractions.",
      updatedPlan: plan,
    };
  }

  // ============================================
  // FAMILY FRIENDLY
  // ============================================
  if (
    msg.includes("family") ||
    msg.includes("kid") ||
    msg.includes("kids") ||
    msg.includes("family-friendly") ||
    msg.includes("family friendly")
  ) {
    plan.activities = [
      ...plan.activities.filter(
        (a) =>
          ![
            "Casino night",
            "Scuba diving",
            "Paragliding",
          ].includes(a)
      ),
      "Amusement park visit",
      "Family picnic",
      "Zoo / aquarium",
    ];

    plan.tips = [
      {
        category: "Family",
        tip:
          "Plan breaks between activities; kids tire faster than adults.",
      },
      ...plan.tips,
    ];

    return {
      reply:
        "Adjusted your trip to be family-friendly with kid-friendly activities and travel tips.",
      updatedPlan: plan,
    };
  }

  // ============================================
  // BUDGET
  // ============================================
  const budgetMatch = msg.match(
    /(?:budget|reduce|increase|set|make).*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i
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

    plan.budget = splits.map(
      (s) => ({
        ...s,
        amount: Math.round(
          (newBudget * s.percentage) / 100
        ),
      })
    ) as any;

    return {
      reply: `Updated your total budget to ₹${newBudget.toLocaleString()} and recalculated the breakdown across all categories.`,
      updatedPlan: plan,
    };
  }

  // ============================================
  // ADD MORE DAYS
  // ============================================

  // Examples supported:
  // add 4 days
  // add 4 more days
  // add 4 day
  // add four days
  // 4 days add karo
  // 4 din badhao
  // 4 din aur add karo
  // trip me 4 days badhado
  // goa trip me 4 days badhado

  let addDays = 0;

  // English numeric
  const englishAddMatch = msg.match(
    /(?:add|increase|extend|extend by|give me|make it|additionally).*?(\d+)\s*(?:more\s*)?days?/i
  );

  // Hinglish numeric
  const hinglishAddMatch = msg.match(
    /(\d+)\s*(?:more\s*)?(?:days?|din).*(?:add|badha|badh|increase|extend|karo|karna|chahiye)/i
  );

  // "trip me 4 days badhado"
  const tripDaysMatch = msg.match(
    /(?:trip|travel|journey).*?(\d+)\s*(?:more\s*)?(?:days?|din).*?(?:badha|badh|add|extend|increase)/i
  );

  if (englishAddMatch) {
    addDays = parseInt(
      englishAddMatch[1],
      10
    );
  } else if (hinglishAddMatch) {
    addDays = parseInt(
      hinglishAddMatch[1],
      10
    );
  } else if (tripDaysMatch) {
    addDays = parseInt(
      tripDaysMatch[1],
      10
    );
  }

  if (addDays > 0) {
    const startDay =
      plan.itinerary.length;

    const themes = [
      "Discovery & Adventure",
      "Culture & Cuisine",
      "Relaxation & Views",
      "Shopping & Nightlife",
    ];

    const attractionCount =
      plan.attractions.length;

    const activityCount =
      plan.activities.length;

    const foodCount =
      plan.localFood.length;

    for (
      let i = 0;
      i < addDays;
      i++
    ) {
      const day =
        startDay + i + 1;

      const theme =
        themes[
          i % themes.length
        ];

      const attraction1 =
        plan.attractions[
          day % attractionCount
        ];

      const attraction2 =
        plan.attractions[
          (day + 1) %
            attractionCount
        ];

      const attraction3 =
        plan.attractions[
          (day + 2) %
            attractionCount
        ];

      const activity =
        plan.activities[
          day % activityCount
        ];

      const breakfast =
        plan.localFood[
          day % foodCount
        ];

      const lunch =
        plan.localFood[
          (day + 1) % foodCount
        ];

      const dinner =
        plan.localFood[
          (day + 2) % foodCount
        ];

      plan.itinerary.push({
        day,
        title: `Day ${day} — ${theme}`,
        theme,

        morning: {
          time: "09:00",
          activity: `Visit ${attraction1}`,
          place: attraction1,
          note:
            "Newly added day with a curated morning experience.",
        },

        afternoon: {
          time: "14:00",
          activity,
          place: attraction2,
          note:
            "Curated activity based on your trip interests.",
        },

        evening: {
          time: "19:00",
          activity:
            "Local dinner & evening stroll",
          place: attraction3,
          note:
            "Relaxing evening to end the day.",
        },

        meals: {
          breakfast,
          lunch,
          dinner,
        },
      });
    }

    // Update total trip days if FullPlan has days
    if ("days" in plan) {
      (plan as any).days =
        plan.itinerary.length;
    }

    return {
      reply: `Done! I've added ${addDays} more day${
        addDays > 1 ? "s" : ""
      } to your ${plan.destination} trip. Your itinerary is now ${plan.itinerary.length} days long.`,
      updatedPlan: plan,
    };
  }

  // ============================================
  // DEFAULT RESPONSE
  // ============================================
  return {
    reply: `I can help with your ${plan.destination} trip. You can ask me things like "add 4 more days", "4 din badhado", "remove museums", "add adventure activities", "make it family-friendly", "budget ₹30000", or "regenerate Day 2".`,
  };
}