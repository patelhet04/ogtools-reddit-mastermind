"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { GenerateForm } from "@/components/generate/generate-form";

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Header title="Generate Calendar" />

        <div className="p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Generate New Calendar
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a new content calendar for your Reddit marketing campaign.
            </p>
          </div>

          <GenerateForm />
        </div>
      </main>
    </div>
  );
}
