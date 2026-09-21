import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, Globe, Shield, LogOut, Info } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: theme === "dark" ? Moon : Sun,
          label: "Dark Mode",
          desc: "Toggle dark/light theme",
          control: <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Bell, label: "Trip Reminders", desc: "Get notified before upcoming trips", control: <Switch defaultChecked /> },
        { icon: Globe, label: "Weather Alerts", desc: "Receive weather updates for your destinations", control: <Switch defaultChecked /> },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Shield, label: "Two-Factor Authentication", desc: "Add an extra layer of security", control: <Switch /> },
        { icon: Info, label: "Data Sharing", desc: "Allow anonymous usage analytics", control: <Switch /> },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your app preferences</p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.title}</h2>
          <Card className="divide-y">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="font-medium">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                {item.control}
              </div>
            ))}
          </Card>
        </div>
      ))}

      <Separator />

      {/* Account */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Account</h2>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Signed in</p>
            </div>
          </div>
        </Card>
        <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
