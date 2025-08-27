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
import AddInspectionModal from "@/components/add-inspection-modal"
import type { Inspection, Transformer } from "@/lib/types"
import Link from "next/link"

export function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [transformers, setTransformers] = useState<Transformer[]>([])
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Time")
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchInspections()
    fetchTransformers()
  }, [])

  useEffect(() => {
    filterInspections()
  }, [inspections, searchTerm, statusFilter])

  const fetchInspections = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/inspections")
      if (!response.ok) {
        throw new Error("Failed to fetch transformers")
      }
      const data_t = await response.json()
      console.log(data_t)
      const data = data_t.map((ins: any) => ({
      id: ins.iid,
      inspection_no: ins.inspectionNumber,
      transformer_no: ins.transformerNumber,
      inspected_date: ins.inspectionDate,
      maintainance_date: ins.maintainanceDate,
      status: ins.status,
      // add other fields if needed
    }));
      setInspections(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch inspections:", error)
      setLoading(false)
    }
  }

  const fetchTransformers = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/transformers")
      if (!response.ok) {
        throw new Error("Failed to fetch transformers")
      }
      const data_t = await response.json()
      const data = data_t.map((t: any) => ({
      id: t.id,
      transformer_no: t.transformerNumber,
      pole_no: t.poleNumber,
      region: t.region, 
      type: t.type,
      // add other fields if needed
    }));
      setTransformers(data)
    } catch (error) {
      console.error("Failed to fetch transformers:", error)
    }
  }

  const filterInspections = () => {
    let filtered = [...inspections]

    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.inspection_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.transformer_no?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "All Time") {
      filtered = filtered.filter((i) => i.status === statusFilter)
    }

    setFilteredInspections(filtered)
  }



  const handleAddInspection = async (data: any) => {
    // Prevent duplicate inspection numbers (client-side check)
    const enteredNo = data.inspection_no?.trim().toLowerCase();
    const exists = inspections.some(i => i.inspection_no?.trim().toLowerCase() === enteredNo);
    if (exists) {
      alert("Inspection number already exists. Please enter a unique number.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("inspectionNumber", data.inspection_no);
      formData.append("transformerNumber", data.transformer_no);
      formData.append("inspectionDate", data.inspected_date);
      formData.append("maintainanceDate", data.maintainance_date);
      formData.append("status", data.status);
      // Add other fields as needed

      const response = await fetch("http://localhost:8080/api/inspections", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        fetchInspections();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to add inspection:", error);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Completed
          </Badge>
        )
      case "In Progress":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            In Progress
          </Badge>
        )
      case "Pending":
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
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Transformer > All Inspections" />

        <div className="flex-1 p-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                I
              </div>
              <h2 className="text-lg font-semibold">All Inspections</h2>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Inspection
            </Button>
            <div className="ml-auto flex gap-2">
              <Link href="/transformers">
                <Button variant="outline">Transformers</Button>
              </Link>
              <Button className="bg-indigo-600">Inspections</Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select defaultValue="By Transformer No">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="By Transformer No">By Transformer No</SelectItem>
                <SelectItem value="By Inspection No">By Inspection No</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search Transformer"
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              Reset Filters
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Transformer No. ↓</TableHead>
                  <TableHead>Inspection No</TableHead>
                  <TableHead>Inspected Date</TableHead>
                  <TableHead>Maintainance Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections.map((inspection, index) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        <Star
                          className={`h-4 w-4 ${index === 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{inspection.transformer_no}</TableCell>
                      <TableCell>{inspection.inspection_no}</TableCell>
                      <TableCell>{formatDate(inspection.inspected_date)}</TableCell>
                      <TableCell>
                        {formatDate(inspection.maintainance_date)}
                      </TableCell>
                      <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/inspections/${inspection.id}`}>
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
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" className="bg-indigo-600 text-white">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              4
            </Button>
            <Button variant="outline" size="sm">
              5
            </Button>
            <Button variant="outline" size="sm">
              6
            </Button>
            <span className="text-gray-500">...</span>
            <Button variant="outline" size="sm">
              50
            </Button>
            <Button variant="outline" size="sm">
              →
            </Button>
          </div>
        </div>
      </div>

      <AddInspectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddInspection}
        transformers={transformers}
      />
    </div>
  )
}
