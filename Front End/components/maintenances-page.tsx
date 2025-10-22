"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import AddMaintenanceModal from "@/components/add-maintenance-modal"
import type { Maintenance } from "@/lib/types"
import Link from "next/link"

export function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Time")
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchMaintenances()
  }, [])

  useEffect(() => {
    filterMaintenances()
  }, [maintenances, searchTerm, statusFilter])

  const fetchMaintenances = async () => {
    try {
      const response = await fetch("/api/maintenance")
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance records")
      }
      let data = await response.json()
      console.log("Raw maintenance data from backend:", data)
      // Map created_at to timestamp for UI compatibility and parse electricalReadings if needed
      data = data.map((m: any) => ({
        ...m,
        timestamp: m.created_at,
        electricalReadings: typeof m.electricalReadings === 'string' ? JSON.parse(m.electricalReadings) : m.electricalReadings
      }))
      // Sort by mid in descending order (newer first)
      data.sort((a: Maintenance, b: Maintenance) => b.mid - a.mid)
      setMaintenances(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch maintenance records:", error)
      setLoading(false)
    }
  }

  const filterMaintenances = () => {
    let filtered = [...maintenances]

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.maintenanceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "All Time") {
      filtered = filtered.filter((m) => m.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredMaintenances(filtered)
  }

  const handleAddMaintenance = async (data: any) => {
    try {
      console.log("Creating maintenance with data:", data)

      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Maintenance created:", result)
        await fetchMaintenances()
        setShowAddModal(false)
      } else {
        const responseText = await response.text()
        console.error("Backend error response:", responseText)
        try {
          const error = JSON.parse(responseText)
          const errorMessage = error.message || error.error || error.details || 'Unknown error'
          alert(`Backend Error (${response.status}): ${errorMessage}`)
        } catch {
          alert(`Backend Error (${response.status}): ${responseText || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error("Failed to add maintenance:", error)
      alert("Failed to add maintenance. Please try again.")
    }
  }

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Completed
          </Badge>
        )
      case "in-progress":
      case "in progress":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredMaintenances.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMaintenances = filteredMaintenances.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Maintenance > All Records" />

        <div className="flex-1 p-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                M
              </div>
              <h2 className="text-lg font-semibold">All Maintenance Records</h2>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select defaultValue="By Maintenance No">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="By Maintenance No">By Maintenance No</SelectItem>
                <SelectItem value="By Inspection No">By Inspection No</SelectItem>
                <SelectItem value="By Inspector">By Inspector</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search Maintenance Records"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" size="sm">
              <Star className="h-4 w-4" />
            </Button>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Time">All Time</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm("")
              setStatusFilter("All Time")
            }}>
              Reset Filters
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Maintenance No. ↓</TableHead>
                  <TableHead>Inspection No</TableHead>
                  <TableHead>Inspector Name</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredMaintenances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No maintenance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMaintenances.map((maintenance) => (
                    <TableRow key={maintenance.mid}>
                      <TableCell className="font-medium">{maintenance.maintenanceNumber}</TableCell>
                      <TableCell>{maintenance.inspectionNumber}</TableCell>
                      <TableCell>{maintenance.inspectorName}</TableCell>
                      <TableCell>{formatDate(maintenance.timestamp)}</TableCell>
                      <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/maintenances/${maintenance.mid}`}>
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ←
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant="outline"
                      size="sm"
                      className={currentPage === page ? "bg-indigo-600 text-white" : ""}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-500">...</span>
                }
                return null
              })}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                →
              </Button>
            </div>
          )}
          
          {filteredMaintenances.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-2">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredMaintenances.length)} of {filteredMaintenances.length} maintenance records
            </div>
          )}
        </div>
      </div>

      <AddMaintenanceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMaintenance}
      />
    </div>
  )
}
