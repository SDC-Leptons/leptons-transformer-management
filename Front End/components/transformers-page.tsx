"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import AddTransformerModal from "./add-transformer-modal"
import type { Transformer } from "@/lib/types"
import Link from "next/link"

export function TransformersPage() {
  const [transformers, setTransformers] = useState<Transformer[]>([])
  const [filteredTransformers, setFilteredTransformers] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("All Regions")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchTransformers()
  }, [])

  useEffect(() => {
    filterTransformers()
  }, [transformers, searchTerm, regionFilter, typeFilter])

  const fetchTransformers = async () => {
    // try {
    //   const response = await fetch("/api/transformers")
    //   const data = await response.json()
    //   setTransformers(data)
    //   setLoading(false)
    // } 
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
        capacity: t.capacity,
      }));
      // Sort by ID in descending order (newer first)
      data.sort((a: Transformer, b: Transformer) => b.id - a.id);
      setTransformers(data)
      setLoading(false)
    }
    catch (error) {
      console.error("Failed to fetch transformers:", error)
      setLoading(false)
    }
  }

  const filterTransformers = () => {
    let filtered = [...transformers]

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.transformer_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.pole_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.region.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (regionFilter !== "All Regions") {
      filtered = filtered.filter((t) => t.region === regionFilter)
    }

    if (typeFilter !== "All Types") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    setFilteredTransformers(filtered)
  }

  const handleAddTransformer = async (data: any) => {
    try {
      console.log("Creating transformer with data:", data);
      
      // Check if there's a baseline image
      if (data.baselineImage) {
        // If there's an image, we need to use FormData
        const formData = new FormData();
        formData.append("poleNumber", data.pole_no);
        formData.append("region", data.region);
        formData.append("type", data.type);
        
        if (data.location_details) {
          formData.append("locationDetails", data.location_details);
        }
        if (data.capacity) {
          formData.append("capacity", data.capacity.toString());
        }
        formData.append("baselineImage", data.baselineImage);

        console.log("Sending FormData with image");

        try {
          const response = await fetch("http://localhost:8080/api/transformers", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log("Transformer created with number:", result.transformerNumber);
            fetchTransformers();
            setShowAddModal(false);
          } else {
            const responseText = await response.text();
            console.error("Backend error response:", responseText);
            try {
              const error = JSON.parse(responseText);
              const errorMessage = error.message || error.error || error.details || 'Unknown error';
              alert(`Backend Error (${response.status}): ${errorMessage}`);
            } catch {
              alert(`Backend Error (${response.status}): ${responseText || 'Unknown error'}`);
            }
          }
        } catch (fetchError) {
          console.error("Network error:", fetchError);
          alert("Cannot connect to backend server. Please ensure:\n1. Backend is running on http://localhost:8080\n2. CORS is properly configured\n3. Network connection is stable");
          throw fetchError; // Re-throw to be caught by outer catch
        }
      } else {
        // No image - send JSON
        const requestBody = {
          poleNumber: data.pole_no,
          region: data.region,
          type: data.type,
          ...(data.location_details && { locationDetails: data.location_details }),
          ...(data.capacity && { capacity: parseFloat(data.capacity) }),
        };

        console.log("Sending JSON:", requestBody);

        try {
          const response = await fetch("http://localhost:8080/api/transformers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("Transformer created with number:", result.transformerNumber);
            fetchTransformers();
            setShowAddModal(false);
          } else {
            const responseText = await response.text();
            console.error("Backend error response:", responseText);
            try {
              const error = JSON.parse(responseText);
              const errorMessage = error.message || error.error || error.details || 'Unknown error';
              alert(`Backend Error (${response.status}): ${errorMessage}`);
            } catch {
              alert(`Backend Error (${response.status}): ${responseText || 'Unknown error'}`);
            }
          }
        } catch (fetchError) {
          console.error("Network error:", fetchError);
          alert("Cannot connect to backend server. Please ensure:\n1. Backend is running on http://localhost:8080\n2. CORS is properly configured\n3. Network connection is stable");
          throw fetchError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error("Failed to add transformer:", error);
      alert("Failed to add transformer. Please try again.");
    }
  }

  const regions = Array.from(new Set(transformers.map((t) => t.region)))
  const types = Array.from(new Set(transformers.map((t) => t.type)))

  // Pagination logic
  const totalPages = Math.ceil(filteredTransformers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransformers = filteredTransformers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, regionFilter, typeFilter])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Transformers" />

        <div className="flex-1 p-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                T
              </div>
              <h2 className="text-lg font-semibold">Transformers</h2>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Transformer
            </Button>
            <div className="ml-auto flex gap-2">
              <Button className="bg-indigo-600">Transformers</Button>
              <Link href="/inspections">
                <Button variant="outline">Inspections</Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="By Transformer No" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Regions">All Regions</SelectItem>
                {regions.filter(Boolean).map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
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

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Regions">All Regions</SelectItem>
                {regions.filter(Boolean).map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                {types.filter(Boolean).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              Reset filters
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transformer No. ↓</TableHead>
                  <TableHead>Pole No.</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity (kVA)</TableHead>
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
                ) : filteredTransformers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No transformers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransformers.map((transformer, index) => (
                    <TableRow key={transformer.id}>
                      <TableCell className="font-medium">{transformer.transformer_no}</TableCell>
                      <TableCell>{transformer.pole_no}</TableCell>
                      <TableCell>{transformer.region}</TableCell>
                      <TableCell>
                        {transformer.type === "Bulk" ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">Bulk</Badge>
                        ) : transformer.type === "Distribution" ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Distribution</Badge>
                        ) : (
                          <Badge variant="secondary">{transformer.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{transformer.capacity ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/transformers/${transformer.id}`}>
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
          
          {filteredTransformers.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-2">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTransformers.length)} of {filteredTransformers.length} transformers
            </div>
          )}
        </div>
      </div>

      <AddTransformerModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddTransformer} />
    </div>
  )
}
