import { Link } from "react-router-dom";
import { Plane, Sparkles, MapPin, Calendar, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-hero">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-emerald-600" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url('https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?auto=compress&cs=tinysrgb&w=1200')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Plane className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">TravelMate AI</span>
          </div>

          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold leading-tight"
            >
              Your AI-powered travel agent that plans the entire trip for you.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-white/80"
            >
              Just tell us where you want to go. We handle the itinerary, budget, hotels, transport, packing, and more.
            </motion.p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: Sparkles, label: "AI Itinerary" },
                { icon: MapPin, label: "Smart Maps" },
                { icon: Calendar, label: "Day-wise Plan" },
                { icon: Shield, label: "Budget Control" },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur"
                >
                  <f.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/60">Trusted by 10,000+ travelers worldwide</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">TravelMate AI</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
