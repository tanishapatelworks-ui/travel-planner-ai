import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plane,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  CloudSun,
  Hotel,
  Car,
  Backpack,
  FileText,
  MessageSquare,
  ArrowRight,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Itinerary Generator", desc: "Describe your trip in natural language and get a complete day-wise plan instantly." },
  { icon: Wallet, title: "Smart Budget Planner", desc: "Automatic budget breakdown across hotels, food, transport, activities & more." },
  { icon: CloudSun, title: "Weather Forecast", desc: "Real-time weather predictions for your travel dates to help you pack right." },
  { icon: Hotel, title: "Hotel Suggestions", desc: "Curated hotel recommendations that fit your budget and travel style." },
  { icon: Car, title: "Transport Options", desc: "Compare flights, trains, buses, and rentals with cost estimates." },
  { icon: Backpack, title: "Packing Checklist", desc: "AI-generated packing list based on destination, weather, and activities." },
  { icon: FileText, title: "PDF Travel Report", desc: "Download a professional, printable itinerary with all your trip details." },
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "Modify your trip dynamically — add activities, change budget, regenerate days." },
];

const stats = [
  { value: "10K+", label: "Trips Planned" },
  { value: "50+", label: "Destinations" },
  { value: "4.9", label: "User Rating" },
  { value: "100%", label: "AI-Powered" },
];

const steps = [
  { icon: MapPin, title: "Tell us your destination", desc: "Enter where you want to go, budget, dates, and interests." },
  { icon: Sparkles, title: "AI creates your plan", desc: "Our agent builds a complete itinerary in seconds." },
  { icon: FileText, title: "Download & travel", desc: "Get your PDF report, pack your bags, and go!" },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
              <Plane className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold">TravelMate AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">AI-powered autonomous travel planning</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight lg:text-6xl">
                Your entire trip,
                <br />
                <span className="text-gradient">planned by AI</span> in seconds.
              </h1>
              <p className="text-lg text-muted-foreground">
                Just tell us where you want to go. TravelMate AI creates a complete day-wise itinerary,
                budget breakdown, hotel picks, transport options, packing list, and a downloadable PDF — automatically.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Start Planning Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">Sign In</Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-emerald-500" />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1">Loved by 10,000+ travelers</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl border bg-card/60 p-6 shadow-2xl backdrop-blur">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Your request:</p>
                    <p className="font-medium">"Plan my Goa trip for 4 days under ₹25,000"</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: Calendar, text: "Day 1: Arrival & Beach Exploration" },
                      { icon: MapPin, text: "Day 2: Heritage & Culture Tour" },
                      { icon: Wallet, text: "Budget: Hotel ₹8,750 | Food ₹5,000" },
                      { icon: Hotel, text: "Hotel: Goa Grand Resort — ₹2,188/night" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 animate-float rounded-xl border bg-card p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">AI generating...</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass rounded-xl p-6 text-center"
              >
                <p className="text-3xl font-bold text-gradient">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold lg:text-4xl">Everything you need for the perfect trip</h2>
          <p className="mt-3 text-lg text-muted-foreground">One AI agent that handles every aspect of travel planning</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">How it works</h2>
            <p className="mt-3 text-lg text-muted-foreground">From idea to itinerary in three steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="mb-2 text-sm font-bold text-primary">STEP {i + 1}</div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-12 text-center text-white lg:p-20">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url('https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1200')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }} />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-bold lg:text-5xl">Ready to plan your next adventure?</h2>
            <p className="text-lg text-white/80">Join thousands of travelers using AI to plan better trips.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Free to start", "No credit card required", "Instant AI plans"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
                  <Check className="h-4 w-4" /> {t}
                </div>
              ))}
            </div>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Planning Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-500">
                <Plane className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">TravelMate AI</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 TravelMate AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
