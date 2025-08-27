"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Star, Eye, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import AddInspectionModal from "@/components/add-inspection-modal"
import { BaselineImageModal } from "@/components/baseline-image-modal"
import type { Inspection } from "@/lib/types"

// Extend Transformer type locally to include baseline_image_url
type TransformerWithBaseline = {
  id: number;
  transformer_no: string;
  pole_no: string;
  region: string;
  type: string;
  status?: string;
  baseline_image_url?: string | null;
  created_at: string;
  updated_at?: string;
  capacity?: number;
  refImage?: string | null;
};

import Link from "next/link"
import { useParams } from "next/navigation"

export default function TransformerDetailPage() {
  const params = useParams()
  const transformerId = params.id as string

  const [transformer, setTransformer] = useState<TransformerWithBaseline | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [transformers, setTransformers] = useState<TransformerWithBaseline[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBaselineModal, setShowBaselineModal] = useState(false)
  // Use baseline_image_url to determine if baseline image exists
  const [hasBaselineImage, setHasBaselineImage] = useState(false)

  useEffect(() => {
    if (transformerId) {
      fetchTransformer()
      fetchAllTransformers()
    }
  }, [transformerId])


  const fetchTransformer = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/transformers/${transformerId}`)
      const data_t = await response.json()
      const data: TransformerWithBaseline = {
        id: data_t.id,
        transformer_no: data_t.transformerNumber,
        pole_no: data_t.poleNumber,
        region: data_t.region,
        type: data_t.type,
        status: data_t.status,
        baseline_image_url: data_t.baselineImage || null,
        refImage: data_t.refImage || null,
        created_at: data_t.created_at ? String(data_t.created_at) : "",
        updated_at: data_t.updated_at ? String(data_t.updated_at) : "",
        capacity: data_t.capacity,
      }
      setTransformer(data)
      // Map inspections to UI format
      const mappedInspections = (data_t.inspections || []).map((ins: any) => ({
        id: ins.iid,
        inspection_no: ins.inspectionNumber,
        transformer_no: ins.transformerNumber,
        inspected_date: ins.inspectionDate,
        maintainance_date: ins.maintainanceDate,
        status: ins.status,
        created_at: ins.created_at,
      }))
      setInspections(mappedInspections)
      // Set hasBaselineImage based on baseline_image_url
  setHasBaselineImage(!!(data_t.baselineImage && data_t.baselineImage !== ""))
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch transformer:", error)
      setLoading(false)
    }
  }


  // fetchInspections removed: now handled in fetchTransformer

  const fetchAllTransformers = async () => {
    try {
      const response = await fetch("/api/transformers")
      const data = await response.json()
      // Map to TransformerWithBaseline[]
      const mapped = data.map((t: any) => ({
        id: t.id,
        transformer_no: t.transformerNumber,
        pole_no: t.poleNumber,
        region: t.region,
        type: t.type,
        status: t.status,
        baseline_image_url: t.baselineImage || null,
        refImage: t.refImage || null,
        created_at: t.created_at ? String(t.created_at) : "",
        updated_at: t.updated_at ? String(t.updated_at) : "",
        capacity: t.capacity,
      }))
      setTransformers(mapped)
    } catch (error) {
      console.error("Failed to fetch all transformers:", error)
    }
  }

  const handleAddInspection = async (data: any) => {
    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          transformer_id: transformerId,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
      }
    } catch (error) {
      console.error("Failed to add inspection:", error)
    }
  }

  // checkBaselineImage removed: now handled in fetchTransformer

  const handleBaselineUpload = async (data: { file: File }) => {
  try {
    const formData = new FormData();
    formData.append("baselineImage", data.file);

    const response = await fetch(`http://localhost:8080/api/transformers/${transformerId}/baselineImage`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - let the browser set it automatically for FormData
    });

    if (response.ok) {
      setHasBaselineImage(true);
      setShowBaselineModal(false);
      // Optionally refresh the transformer data
      await fetchTransformer();
    } else {
      const errorData = await response.json();
      console.error("Upload failed:", errorData);
    }
  } catch (error) {
    console.error("Failed to upload baseline image:", error);
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

  if (!transformer) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Transformer" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Loading transformer details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Transformer" />

        <div className="flex-1 p-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/transformers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                T
              </div>
              <h2 className="text-lg font-semibold">{transformer.transformer_no}</h2>
            </div>
            <div className="text-sm text-gray-500">
              Last Inspected Date: {inspections.length > 0 ? formatDate(inspections[0].inspected_date) : "Never"}
            </div>
            <div className="ml-auto flex gap-2">
              {(() => {
                const hasBaseline = Boolean(transformer && transformer.baseline_image_url && transformer.baseline_image_url !== "");
                return (
                  <Button
                    size="sm"
                    disabled={hasBaseline}
                    onClick={() => !hasBaseline && setShowBaselineModal(true)}
                    className={
                      hasBaseline
                        ? "bg-green-500 border-green-600 text-white cursor-not-allowed hover:bg-green-500 hover:border-green-600 hover:text-white"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }
                  >
                    {hasBaseline ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Baseline Image
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Baseline Image
                      </>
                    )}
                  </Button>
                );
              })()}
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transformer Details */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.transformer_no}</div>
                <div className="text-sm text-gray-500">Transformer No</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.pole_no}</div>
                <div className="text-sm text-gray-500">Pole No</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.region}</div>
                <div className="text-sm text-gray-500">Branch</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">A-110</div>
                <div className="text-sm text-gray-500">Inspected By</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.pole_no}</div>
                <div className="text-sm text-gray-500">Pole No</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.capacity || "102.97"}</div>
                <div className="text-sm text-gray-500">Capacity</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{transformer.type}</div>
                <div className="text-sm text-gray-500">Type</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">2</div>
                <div className="text-sm text-gray-500">No. of Feeders</div>
              </CardContent>
            </Card>
          </div>

          {/* Baseline and Reference Images */}
          <div className="flex gap-8 mb-8">
            <div>
              <div className="font-semibold mb-2">Baseline Image</div>
              {transformer.baseline_image_url ? (
                <img
                  src={transformer.baseline_image_url}
                  alt="Baseline"
                  className="w-64 h-64 object-contain border rounded"
                />
              ) : (
                <div className="text-gray-500">Baseline image not here</div>
              )}
            </div>
            {transformer.refImage && (
              <div>
                <div className="font-semibold mb-2">Reference Image</div>
                <img
                  src={transformer.refImage}
                  alt="Reference"
                  className="w-64 h-64 object-contain border rounded"
                />
              </div>
            )}
          </div>

          {/* Transformer Inspections */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transformer Inspections</h3>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Inspection
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Inspection No ↓</TableHead>
                  <TableHead>Inspected Date</TableHead>
                  <TableHead>Maintenance Date</TableHead>
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
                ) : inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No inspections found for this transformer
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((inspection, index) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        <Star
                          className={`h-4 w-4 ${index === 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{inspection.inspection_no}</TableCell>
                      <TableCell>{formatDate(inspection.inspected_date)}</TableCell>
                      <TableCell>
                        {inspection.maintainance_date ? formatDate(inspection.maintainance_date) : "-"}
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
        </div>
      </div>

      <AddInspectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddInspection}
        transformers={transformers as any}
      />

      <BaselineImageModal
        open={showBaselineModal}
        onClose={() => setShowBaselineModal(false)}
        onSubmit={handleBaselineUpload}
        transformerId={transformerId}
      />
    </div>
  )
}
