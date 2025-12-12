"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { CompanyForm } from "@/components/company/company-form"
import type { CompanyUpsertPayload, UICompany } from "@/lib/types"
import { apiGet, apiSend } from "@/lib/api"

export default function CompanyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [company, setCompany] = useState<UICompany | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<UICompany>(`/api/companies/${id}`)
      .then((data) => setCompany(data))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (updatedCompany: CompanyUpsertPayload) => {
    await apiSend(`/api/companies/${id}`, "PUT", updatedCompany)
    router.push("/companies")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <Header title="Loading..." />
          <div className="p-4 lg:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded-xl w-48" />
              <div className="h-96 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!company) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Header title={company.name} />

        <div className="p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Edit Company</h2>
            <p className="text-muted-foreground">Update your company profile and settings.</p>
          </div>

          <CompanyForm company={company} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}
