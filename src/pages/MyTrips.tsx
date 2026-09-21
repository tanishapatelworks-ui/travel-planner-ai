import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, Plus, Search, Heart, Calendar, Wallet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listTrips, updateTrip } from "@/lib/api";
import type { Trip } from "@/types";
import { toast } from "sonner";

type FilterType = "all" | "planned" | "upcoming" | "completed" | "favorite";

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    listTrips()
      .then((data) => setTrips(data as Trip[]))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = async (trip: Trip) => {
    try {
      await updateTrip(trip.id, { is_favorite: !trip.is_favorite });
      setTrips((prev) => prev.map((t) => t.id === trip.id ? { ...t, is_favorite: !t.is_favorite } : t));
    } catch {
      toast.error("Failed to update");
    }
  };

  const filtered = trips.filter((t) => {
    const matchesSearch = t.destination.toLowerCase().includes(search.toLowerCase()) || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : filter === "favorite" ? t.is_favorite : t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "planned", label: "Planned" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
    { key: "favorite", label: "Favorites" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">My Trips</h1>
          <p className="mt-1 text-muted-foreground">{trips.length} trip{trips.length !== 1 ? "s" : ""} planned</p>
        </div>
        <Link to="/planner">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Trip</Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search trips..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">{search || filter !== "all" ? "No trips match your filters" : "No trips yet"}</p>
            <p className="text-sm text-muted-foreground">{search || filter !== "all" ? "Try adjusting your search" : "Start planning your first adventure with AI"}</p>
          </div>
          <Link to="/planner">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Your First Trip</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/trips/${trip.id}`}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
                  <div className="relative h-32 bg-gradient-to-br from-primary/20 to-emerald-500/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Map className="h-12 w-12 text-primary/30" />
                    </div>
                    <div className="absolute right-3 top-3 flex gap-1.5">
                      <Badge className="bg-background/80 backdrop-blur">{trip.status}</Badge>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFav(trip); }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur"
                      >
                        <Heart className={`h-3.5 w-3.5 ${trip.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary">{trip.destination}</h3>
                    <p className="mb-3 text-sm text-muted-foreground">{trip.title}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {trip.days}d
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" /> {trip.travelers}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Wallet className="h-3 w-3" /> ₹{(Number(trip.budget_total) / 1000).toFixed(0)}k
                      </div>
                    </div>
                    {trip.interests?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {trip.interests.slice(0, 3).map((int) => <Badge key={int} variant="outline" className="text-xs">{int}</Badge>)}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
