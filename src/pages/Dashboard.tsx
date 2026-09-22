import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Map,
  MapPin,
  Calendar,
  Wallet,
  Heart,
  TrendingUp,
  ArrowRight,
  Plane,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import type { Trip } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTrips([]);
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

        // Newest trips first
        tripData.sort((a: any, b: any) => {
          const aTime = a.created_at?.toMillis?.() ?? 0;
          const bTime = b.created_at?.toMillis?.() ?? 0;

          return bTime - aTime;
        });

        setTrips(tripData);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase trips error:", error);
        setTrips([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const upcoming = trips
    .filter(
      (t) => t.status === "upcoming" || t.status === "planned"
    )
    .slice(0, 3);

  const recent = trips.slice(0, 3);

  const favorites = trips
    .filter((t) => t.is_favorite)
    .slice(0, 3);

  const totalBudget = trips.reduce(
    (sum, t) => sum + Number(t.budget_total || 0),
    0
  );

  const completedCount = trips.filter(
    (t) => t.status === "completed"
  ).length;

  const stats = [
    {
      label: "Total Trips",
      value: trips.length,
      icon: Map,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Upcoming",
      value: upcoming.length,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-500",
    },
    {
      label: "Total Budget",
      value: `₹${totalBudget.toLocaleString()}`,
      icon: Wallet,
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">
            Welcome back,{" "}
            {profile?.full_name?.split(" ")[0] || "Traveler"}!
          </h1>

          <p className="mt-1 text-muted-foreground">
            Here's your travel overview
          </p>
        </div>

        <Button
          onClick={() => navigate("/planner")}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Plan New Trip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden p-5">
              <div
                className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10`}
              />

              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md`}
              >
                <s.icon className="h-5 w-5" />
              </div>

              <p className="text-2xl font-bold">{s.value}</p>

              <p className="text-sm text-muted-foreground">
                {s.label}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Trips */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Trips
          </h2>

          <Link
            to="/trips"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-48 rounded-xl"
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>

            <div>
              <p className="font-medium">
                No upcoming trips yet
              </p>

              <p className="text-sm text-muted-foreground">
                Start planning your next adventure with AI
              </p>
            </div>

            <Button
              onClick={() => navigate("/planner")}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Create Trip
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/trips/${trip.id}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
                    <div className="relative h-28 bg-gradient-to-br from-primary/20 to-emerald-500/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-primary/40" />
                      </div>

                      <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
                        {trip.days} days
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold group-hover:text-primary">
                        {trip.destination}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {trip.title}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          ₹{Number(trip.budget_total || 0).toLocaleString()}
                        </span>

                        <span className="text-muted-foreground">
                          {trip.travelers} traveler
                          {trip.travelers > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recent + Favorites */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Trips */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Trips
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 rounded-xl"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No trips yet
            </Card>
          ) : (
            <div className="space-y-3">
              {recent.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                >
                  <Card className="flex items-center gap-4 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Map className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">
                        {trip.destination}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {trip.days} days · ₹
                        {Number(
                          trip.budget_total || 0
                        ).toLocaleString()}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Favorite Destinations */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Heart className="h-5 w-5 text-primary" />
              Favorite Destinations
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 rounded-xl"
                />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No favorites yet. Tap the heart icon on any trip
              to save it here.
            </Card>
          ) : (
            <div className="space-y-3">
              {favorites.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                >
                  <Card className="flex items-center gap-4 p-4 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                      <Heart className="h-5 w-5 fill-current" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">
                        {trip.destination}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {trip.title}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}