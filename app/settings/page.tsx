"use client";

import { useTheme } from "next-themes";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Bell, Palette, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast.success(`Theme changed to ${value}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Header title="Settings" />

        <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences.
            </p>
          </div>

          {/* Profile Section */}
          <section className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Profile</h3>
                <p className="text-xs text-muted-foreground">
                  Your personal information
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">
                    First Name
                  </Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">
                    Last Name
                  </Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john@example.com"
                />
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  How we contact you
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Email Notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Calendar Reminders
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get reminded before posts go live
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Weekly Reports
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Performance summaries
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Appearance</h3>
                <p className="text-xs text-muted-foreground">
                  Customize your experience
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Timezone</Label>
                <Select defaultValue="utc-8">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">Pacific Time (PT)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (ET)</SelectItem>
                    <SelectItem value="utc+0">UTC</SelectItem>
                    <SelectItem value="utc+1">
                      Central European (CET)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
