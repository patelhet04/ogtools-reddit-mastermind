"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { CompanyForm } from "@/components/company/company-form"
import type { CompanyUpsertPayload } from "@/lib/types"
import { apiSend } from "@/lib/api"

export default function NewCompanyPage() {
  const router = useRouter()

  const handleSave = async (company: CompanyUpsertPayload) => {
    await apiSend("/api/companies", "POST", company)
    router.push("/companies")
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Header title="Add Company" />

        <div className="p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Add New Company</h2>
            <p className="text-muted-foreground">Set up a company profile for your Reddit marketing campaigns.</p>
          </div>

          <CompanyForm onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}
