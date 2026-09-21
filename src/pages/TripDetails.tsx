import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Wallet,
  Car,
  MapPin,
  Hotel,
  Backpack,
  Lightbulb,
  Phone,
  CloudSun,
  FileText,
  Heart,
  Trash2,
  Sun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Star,
  Clock,
  Check,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrip, updateTrip, deleteTrip, getWeather } from "@/lib/api";
import { generateTripPDF } from "@/lib/pdf";
import type { Trip as TripType, WeatherForecastDay } from "@/types";

function weatherIcon(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("rain") && c.includes("thunder")) return CloudLightning;
  if (c.includes("thunder")) return CloudLightning;
  if (c.includes("drizzle")) return CloudDrizzle;
  if (c.includes("rain")) return CloudRain;
  if (c.includes("cloud")) return Cloud;
  return Sun;
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripType | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherForecastDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [checkedPacking, setCheckedPacking] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    getTrip(id)
      .then((data) => {
        if (!data) { navigate("/trips"); return; }
        const t = data as TripType;
        setTrip(t);
        getWeather(t.destination, 7)
          .then((w) => setWeather(w.forecast))
          .catch(() => {})
          .finally(() => setWeatherLoading(false));
      })
      .catch(() => navigate("/trips"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const toggleFavorite = async () => {
    if (!trip) return;
    try {
      await updateTrip(trip.id, { is_favorite: !trip.is_favorite });
      setTrip({ ...trip, is_favorite: !trip.is_favorite });
      toast.success(trip.is_favorite ? "Removed from favorites" : "Added to favorites");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    try {
      await deleteTrip(trip.id);
      toast.success("Trip deleted");
      navigate("/trips");
    } catch {
      toast.error("Failed to delete trip");
    }
  };

  const handlePDF = () => {
    if (!trip) return;
    generateTripPDF(trip);
    toast.success("PDF downloaded!");
  };

  const togglePacking = (item: string) => {
    setCheckedPacking((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!trip || !trip.plan) return null;
  const plan = trip.plan;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/trips">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Trips
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleFavorite} className="gap-1.5">
            <Heart className={`h-4 w-4 ${trip.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
            {trip.is_favorite ? "Favorited" : "Favorite"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1.5 text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button size="sm" onClick={handlePDF} className="gap-1.5">
            <FileText className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden">
          <div className="relative h-48 bg-gradient-to-br from-primary/30 via-primary/15 to-emerald-500/20 lg:h-56">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-primary/30" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl font-bold lg:text-3xl">{trip.destination}</h1>
              <p className="text-sm text-muted-foreground">{trip.title}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
            {[
              { icon: Calendar, label: "Duration", value: `${trip.days} days` },
              { icon: Users, label: "Travelers", value: `${trip.travelers}` },
              { icon: Wallet, label: "Budget", value: `${trip.currency} ${Number(trip.budget_total).toLocaleString()}` },
              { icon: Car, label: "Transport", value: trip.transport },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-semibold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Summary */}
      <Card className="p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>
        {trip.interests?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {trip.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="itinerary" className="space-y-4">
        <TabsList className="flex w-full flex-wrap gap-1 lg:flex-nowrap">
          <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
          <TabsTrigger value="budget" className="flex-1">Budget</TabsTrigger>
          <TabsTrigger value="weather" className="flex-1">Weather</TabsTrigger>
          <TabsTrigger value="hotels" className="flex-1">Hotels</TabsTrigger>
          <TabsTrigger value="transport" className="flex-1">Transport</TabsTrigger>
          <TabsTrigger value="packing" className="flex-1">Packing</TabsTrigger>
          <TabsTrigger value="tips" className="flex-1">Tips & Emergency</TabsTrigger>
        </TabsList>

        {/* Itinerary */}
        <TabsContent value="itinerary" className="space-y-4">
          {plan.itinerary.map((day, i) => (
            <motion.div key={day.day} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
                  <h3 className="font-semibold">{day.title}</h3>
                  <Badge variant="outline">{day.theme}</Badge>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-3">
                  {[
                    { label: "Morning", slot: day.morning, color: "text-amber-500" },
                    { label: "Afternoon", slot: day.afternoon, color: "text-orange-500" },
                    { label: "Evening", slot: day.evening, color: "text-indigo-500" },
                  ].map((m) => (
                    <div key={m.label} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${m.color}`} />
                        <span className="text-sm font-semibold">{m.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{m.slot.time}</span>
                      </div>
                      <p className="text-sm font-medium">{m.slot.activity}</p>
                      <p className="text-xs text-muted-foreground">{m.slot.note}</p>
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <MapPin className="h-3 w-3" /> {m.slot.place}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t bg-muted/20 px-5 py-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong className="text-amber-600">Breakfast:</strong> {day.meals.breakfast}</span>
                    <span><strong className="text-orange-600">Lunch:</strong> {day.meals.lunch}</span>
                    <span><strong className="text-indigo-600">Dinner:</strong> {day.meals.dinner}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Budget */}
        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Budget Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={plan.budget} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={(e: any) => `${e.category}`}>
                    {plan.budget.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${trip.currency} ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plan.budget}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${trip.currency} ${v.toLocaleString()}`} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {plan.budget.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              {plan.budget.map((b) => (
                <div key={b.category} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: b.color }} />
                  <span className="flex-1 text-sm font-medium">{b.category}</span>
                  <span className="text-sm text-muted-foreground">{b.percentage}%</span>
                  <span className="w-24 text-right font-semibold">{trip.currency} {b.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-3 font-bold">
                <span>Total</span>
                <span>{trip.currency} {Number(trip.budget_total).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Weather */}
        <TabsContent value="weather" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Weather Forecast — {trip.destination}</h3>
            </div>
            {weatherLoading ? (
              <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                  <strong>Travel advice:</strong> {plan.weather.advice}
                </div>
                <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {weather.map((w, i) => {
                    const Icon = weatherIcon(w.condition);
                    return (
                      <div key={i} className="rounded-xl border p-3 text-center">
                        <p className="text-xs font-medium">{w.dayName}</p>
                        <p className="text-[10px] text-muted-foreground">{w.date}</p>
                        <Icon className="mx-auto my-2 h-8 w-8 text-primary" />
                        <p className="text-sm font-semibold">{w.tempMax}°</p>
                        <p className="text-xs text-muted-foreground">{w.tempMin}°</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{w.condition}</p>
                        <p className="text-[10px] text-muted-foreground">💧{w.humidity}%</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Hotels */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {plan.hotels.map((hotel, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative h-28 bg-gradient-to-br from-primary/20 to-emerald-500/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Hotel className="h-10 w-10 text-primary/40" />
                    </div>
                    <Badge className="absolute right-3 top-3" variant="secondary">{hotel.tier}</Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{hotel.name}</h3>
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{hotel.rating}</span>
                    </div>
                    <p className="mt-2 text-lg font-bold">{trip.currency} {hotel.pricePerNight.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {hotel.amenities.map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{hotel.reason}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Transport */}
        <TabsContent value="transport" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {plan.transport.map((t, i) => (
              <Card key={i} className="flex items-start gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Car className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t.mode}</h3>
                    <span className="font-bold">{trip.currency} {t.estimatedCost.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.type}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{t.duration}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t.notes}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Packing */}
        <TabsContent value="packing" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Backpack className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Packing Checklist</h3>
              <span className="ml-auto text-sm text-muted-foreground">{checkedPacking.size}/{plan.packing.length} packed</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {plan.packing.map((item, i) => {
                const key = `${item.category}-${item.item}`;
                const checked = checkedPacking.has(key);
                return (
                  <button
                    key={i}
                    onClick={() => togglePacking(key)}
                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50"
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                      {checked && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${checked ? "line-through text-muted-foreground" : ""}`}>{item.item}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    {item.essential && <Badge variant="destructive" className="text-xs">Essential</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tips & Emergency */}
        <TabsContent value="tips" className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Travel Tips</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {plan.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 rounded-lg border p-3">
                  <Badge variant="secondary">{tip.category}</Badge>
                  <p className="flex-1 text-sm text-muted-foreground">{tip.tip}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-red-500/20 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Emergency Contacts</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.emergency.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <div className="flex-1">
                    <p className="font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.note}</p>
                  </div>
                  <span className="font-bold text-destructive">{e.number}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attractions & Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-primary" /> Top Attractions</h3>
          <div className="flex flex-wrap gap-2">
            {plan.attractions.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Star className="h-5 w-5 text-primary" /> Activities</h3>
          <div className="flex flex-wrap gap-2">
            {plan.activities.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}
          </div>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <h3 className="flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-primary" /> Map — {trip.destination}</h3>
        </div>
        <iframe
          title="Destination Map"
          className="h-80 w-full border-0"
          src={`https://www.google.com/maps?q=${encodeURIComponent(trip.destination)}&output=embed`}
        />
      </Card>

      {/* Chat CTA */}
      <Card className="flex flex-col items-center justify-between gap-4 bg-gradient-to-br from-primary/10 to-emerald-500/10 p-6 sm:flex-row">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-5 w-5 text-primary" /> Want to modify this trip?</h3>
          <p className="text-sm text-muted-foreground">Ask the AI assistant to add activities, change budget, regenerate days, and more.</p>
        </div>
        <Link to={`/chat?trip=${trip.id}`}>
          <Button className="gap-2">
            <Lightbulb className="h-4 w-4" /> Open AI Chat
          </Button>
        </Link>
      </Card>
    </div>
  );
}
