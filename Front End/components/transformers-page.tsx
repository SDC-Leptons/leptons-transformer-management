"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        // add other fields if needed
      }));
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
    // Prevent duplicate transformer numbers
    const enteredNo = data.transformer_no?.trim().toLowerCase();
    const exists = transformers.some(t => t.transformer_no?.trim().toLowerCase() === enteredNo);
    if (exists) {
      alert("Transformer number already exists. Please enter a unique number.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("transformerNumber", data.transformer_no);
      formData.append("poleNumber", data.pole_no);
      formData.append("region", data.region);
      formData.append("type", data.type);

      const response = await fetch("http://localhost:8080/api/transformers", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        fetchTransformers();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to add transformer:", error);
    }
  }

  const regions = Array.from(new Set(transformers.map((t) => t.region)))
  const types = Array.from(new Set(transformers.map((t) => t.type)))

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
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Transformer No. ↓</TableHead>
                  <TableHead>Pole No.</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
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
                  filteredTransformers.map((transformer, index) => (
                    <TableRow key={transformer.id}>
                      <TableCell>
                        <Star
                          className={`h-4 w-4 ${index === 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{transformer.transformer_no}</TableCell>
                      <TableCell>{transformer.pole_no}</TableCell>
                      <TableCell>{transformer.region}</TableCell>
                      <TableCell>{transformer.type}</TableCell>
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

      <AddTransformerModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddTransformer} />
    </div>
  )
}
