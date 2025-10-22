"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Trash2, Calendar, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import type { Maintenance } from "@/lib/types"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const maintenanceId = params.id as string

  const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (maintenanceId) {
      fetchMaintenance()
    }
  }, [maintenanceId])

  const fetchMaintenance = async () => {
    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`)
      if (!res.ok) {
        throw new Error("Failed to fetch maintenance record")
      }
      let data = await res.json()
      // Map created_at to timestamp and parse electricalReadings if needed
      data = {
        ...data,
        timestamp: data.created_at,
        electricalReadings: typeof data.electricalReadings === 'string' ? JSON.parse(data.electricalReadings) : data.electricalReadings
      }
      console.log("Maintenance data:", data)
      setMaintenance(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch maintenance:", error)
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) {
      return
    }

    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/maintenances")
      } else {
        alert("Failed to delete maintenance record")
      }
    } catch (error) {
      console.error("Failed to delete maintenance:", error)
      alert("Failed to delete maintenance record")
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 text-lg px-4 py-1">
            Completed
          </Badge>
        )
      case "in-progress":
      case "in progress":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-lg px-4 py-1">
            In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 text-lg px-4 py-1">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="text-lg px-4 py-1">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Maintenance Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!maintenance) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Maintenance Details" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-gray-500">Maintenance record not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Maintenance > ${maintenance.maintenanceNumber}`} />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="mb-6">
            <Link href="/maintenances">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Maintenance Records
              </Button>
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{maintenance.maintenanceNumber}</h1>
                <p className="text-gray-500 mt-1">
                  Inspection: <Link href={`/inspections/${maintenance.inspectionNumber}`} className="text-indigo-600 hover:underline">{maintenance.inspectionNumber}</Link>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(maintenance.status)}
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Maintenance Number</p>
                    <p className="font-semibold text-gray-900">{maintenance.maintenanceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inspection Number</p>
                    <p className="font-semibold text-gray-900">
                      <Link href={`/inspections/${maintenance.inspectionNumber}`} className="text-indigo-600 hover:underline">
                        {maintenance.inspectionNumber}
                      </Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inspector Name</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {maintenance.inspectorName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timestamp</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(maintenance.timestamp)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Electrical Readings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Electrical Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(maintenance.electricalReadings).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(maintenance.electricalReadings).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 capitalize">{key}</p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No electrical readings recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Recommended Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenance.recommendedActions ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{maintenance.recommendedActions}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recommended actions specified</p>
                )}
              </CardContent>
            </Card>

            {/* Additional Remarks Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  Additional Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenance.additionalRemarks ? (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{maintenance.additionalRemarks}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No additional remarks</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Timeline (Optional Enhancement) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Maintenance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{maintenance.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(maintenance.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inspector</p>
                  <p className="text-lg font-semibold text-gray-900">{maintenance.inspectorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Readings Recorded</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {Object.keys(maintenance.electricalReadings).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
