"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Upload, Eye, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ThermalImageComparison } from "@/components/thermal-image-comparison"
import type { ThermalImage } from "@/lib/types"

import type { Inspection } from "@/lib/types";
import Link from "next/link"
import { useParams } from "next/navigation"

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [thermalImages, setThermalImages] = useState<ThermalImage[]>([])
  const [baselineImage, setBaselineImage] = useState<ThermalImage | null>(null)
  const [currentImage, setCurrentImage] = useState<ThermalImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [environmentalCondition, setEnvironmentalCondition] = useState("sunny")
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    if (inspectionId) {
      fetchInspection()
      // fetchThermalImages()
    }
  }, [inspectionId])

  const fetchInspection = async () => {
    try {
          const res = await fetch(`http://localhost:8080/api/inspections/${inspectionId}`)
          const data = await res.json()
          setInspection({
            ...data,
            transformer_no: data.transformerNumber,
            inspection_no: data.inspectionNumber,
            inspected_date: data.inspectionDate,
            maintainance_date: data.maintainanceDate,
            baseline_image: data.baselineImage,
            ref_image: data.refImage,
          });
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch inspection:", error)
      setLoading(false)
    }
  }

  const fetchThermalImages = async () => {
    try {
      // Fetch baseline image for transformer
      const baselineResponse = await fetch(
        `/api/thermal-images?transformer_no=${inspection?.transformer_no}&image_type=baseline`,
      )
      const baselineData = await baselineResponse.json()
      if (baselineData.length > 0) {
        setBaselineImage(baselineData[0])
      }

      // Fetch current inspection image
      const currentResponse = await fetch(`/api/thermal-images?inspection_id=${inspectionId}&image_type=maintenance`)
      const currentData = await currentResponse.json()
      if (currentData.length > 0) {
        setCurrentImage(currentData[0])
        setShowComparison(true)
      }
    } catch (error) {
      console.error("Failed to fetch thermal images:", error)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const uploadData = {
        transformer_no: inspection?.transformer_no,
        inspection_id: inspectionId,
        image_type: "maintenance",
        environmental_condition: environmentalCondition,
        uploader_name: "A-110",
      }

      const response = await fetch("/api/thermal-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      })

      if (response.ok) {
        const newImage = await response.json()
        setCurrentImage(newImage)
        setUploadProgress(100)
        setShowComparison(true)

        // Update inspection status
        await fetch(`/api/inspections/${inspectionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "In Progress" }),
        })
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 1000)
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

  // Helper to check if a string is a valid image URL
  const isValidImage = (url?: string | null) => url && typeof url === "string" && url.trim() !== "";

  if (loading || !inspection) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Transformer" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Loading inspection details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showComparison && baselineImage && currentImage) {
    // You need to obtain the Transformer object, not just the transformer_no string.
    // Assuming you have a way to fetch or map the transformer object, e.g., inspection.transformer:
    return (
      <ThermalImageComparison
        inspection={inspection}
        baselineImage={baselineImage}
        currentImage={currentImage}
        onBack={() => setShowComparison(false)}
      />
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Transformer" />

        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/inspections">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                I
              </div>
              <h2 className="text-lg font-semibold">{inspection.inspection_no}</h2>
            </div>
            <div className="text-sm text-gray-500">Last updated: {inspection.inspected_date ? formatDate(inspection.inspected_date) : "N/A"}</div>
            <div className="ml-auto flex gap-2">
              {getStatusBadge(inspection.status)}
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Baseline Image
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Inspection Details */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{inspection.transformer_no}</div>
                <div className="text-sm text-gray-500">Transformer No</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{inspection.inspection_no}</div>
                <div className="text-sm text-gray-500">Inspection No</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{inspection.inspected_date}</div>
                <div className="text-sm text-gray-500">Inspection Date</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold">{inspection.maintainance_date}</div>
                <div className="text-sm text-gray-500">Maintenance Date</div>
              </CardContent>
            </Card>
          </div>

          {/* Baseline and Ref Image Tiles */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Baseline Image Tile */}
            <Card>
              <CardHeader>
                <CardTitle>Baseline Image</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                {isValidImage(inspection.baseline_image) ? (
                  <a href={inspection.baseline_image!} target="_blank" rel="noopener noreferrer">
                    <img src={inspection.baseline_image!} alt="Baseline" className="max-h-40 rounded mb-2" />
                  </a>
                ) : (
                  <div className="text-gray-500 text-center">Baseline not available</div>
                )}
              </CardContent>
            </Card>

            {/* Ref Image Tile */}
            <Card>
              <CardHeader>
                <CardTitle>Reference Image</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                {isValidImage(inspection.ref_image) ? (
                  <a href={inspection.ref_image!} target="_blank" rel="noopener noreferrer">
                    <img src={inspection.ref_image!} alt="Reference" className="max-h-40 rounded mb-2" />
                  </a>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-gray-500 mb-2">No reference image uploaded</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("refImage", file);
                        await fetch(`http://localhost:8080/api/inspections/${inspectionId}/refImage`, {
                          method: "POST",
                          body: formData,
                        });
                        // Optionally, refetch inspection data to update UI
                        fetchInspection();
                      }}
                      className="hidden"
                      id="ref-image-upload"
                    />
                    <label htmlFor="ref-image-upload">
                      <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                        <span>Upload Reference Image</span>
                      </Button>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <Upload className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Thermal Image Upload</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div className="bg-yellow-500 h-1 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">AI Analysis</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div className="bg-gray-300 h-1 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Thermal Image Review</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div className="bg-gray-300 h-1 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
