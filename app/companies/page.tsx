"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, Hash, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { UICompany } from "@/lib/types";
import { apiGet } from "@/lib/api";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<UICompany[]>([]);

  useEffect(() => {
    apiGet<UICompany[]>("/api/companies")
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Header title="Companies" />

        <div className="p-4 lg:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Companies
              </h2>
              <p className="text-sm text-muted-foreground">
                {companies.length} compan{companies.length !== 1 ? "ies" : "y"}{" "}
                configured
              </p>
            </div>
            <Link href="/companies/new">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Add Company
              </Button>
            </Link>
          </div>

          {companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Add your first company to start generating Reddit content calendars."
              action={{
                label: "Add Company",
                onClick: () => (window.location.href = "/companies/new"),
              }}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="group block bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {company.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {company.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {company.personas.length} personas
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {company.subreddits.length} subreddits
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
