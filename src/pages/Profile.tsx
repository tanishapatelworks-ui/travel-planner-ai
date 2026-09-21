import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Wallet, Heart, Loader2, Camera, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, updateProfile } from "@/lib/api";
import type { Profile } from "@/types";

const BUDGETS = ["Budget", "Mid-range", "Luxury", "Ultra Luxury"];
const DESTINATIONS = ["Goa", "Delhi", "Mumbai", "Jaipur", "Kerala", "Bangalore", "Paris", "Tokyo", "Dubai", "Bali", "Singapore", "London"];

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);

  useEffect(() => {
    getProfile()
      .then((data) => {
        const p = data as Profile | null;
        if (p) {
          setProfile(p);
          setFullName(p.full_name || "");
          setAvatarUrl(p.avatar_url || "");
          setBudget(p.preferred_budget || "");
          setDestinations(p.preferred_destinations || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDest = (d: string) => {
    setDestinations((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl,
        preferred_budget: budget,
        preferred_destinations: destinations,
      });
      await refreshProfile();
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (fullName || user?.email || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-8">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your personal info and travel preferences</p>
      </div>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{fullName || "Traveler"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {budget && <Badge variant="secondary" className="mt-1">{budget} Traveler</Badge>}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Edit form */}
      <Card className="space-y-5 p-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> Email</Label>
          <Input value={user?.email || ""} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Camera className="h-4 w-4 text-primary" /> Avatar URL</Label>
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-primary" /> Preferred Budget</Label>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  budget === b ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-primary" /> Favorite Destinations</Label>
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDest(d)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  destinations.includes(d) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                }`}
              >
                {destinations.includes(d) && <Check className="h-3 w-3" />}
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Changes
        </Button>
      </Card>
    </div>
  );
}
