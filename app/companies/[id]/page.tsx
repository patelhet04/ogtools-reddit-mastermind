"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { CompanyForm } from "@/components/company/company-form"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { CompanyUpsertPayload, UICompany } from "@/lib/types"
import { apiGet, apiSend } from "@/lib/api"

export default function CompanyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [company, setCompany] = useState<UICompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    apiGet<UICompany>(`/api/companies/${id}`)
      .then((data) => setCompany(data))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (updatedCompany: CompanyUpsertPayload) => {
    await apiSend(`/api/companies/${id}`, "PUT", updatedCompany)
    router.push("/companies")
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiSend(`/api/companies/${id}`, "DELETE")
      toast.success("Company deleted successfully")
      router.push("/companies")
    } catch (error) {
      toast.error("Failed to delete company")
      setDeleting(false)
    }
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Edit Company</h2>
              <p className="text-muted-foreground">Update your company profile and settings.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{company.name}</strong>? This will also delete all associated personas, subreddits, and content calendars. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? "Deleting..." : "Delete Company"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <CompanyForm company={company} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}
