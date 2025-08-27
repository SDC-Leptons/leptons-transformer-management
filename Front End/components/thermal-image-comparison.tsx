"use client"

import { useState } from "react"
import { ArrowLeft, AlertTriangle, RotateCcw, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import type { Inspection, Transformer, ThermalImage } from "@/lib/types"

interface ThermalImageComparisonProps {
  inspection: Inspection
  baselineImage: ThermalImage
  currentImage: ThermalImage
  onBack: () => void
}

export function ThermalImageComparison({
  inspection,
  baselineImage,
  currentImage,
  onBack,
}: ThermalImageComparisonProps) {
  const [annotationMode, setAnnotationMode] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })} ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Transformer" />

        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white text-sm font-medium">
                I
              </div>
              <h2 className="text-lg font-semibold">{inspection.inspection_no}</h2>
            </div>
            <div className="text-sm text-gray-500">Last updated: Placeholder</div>
            <div className="ml-auto flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Inspection in progress
              </Badge>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Baseline Image
              </Button>
              <Button variant="outline" size="sm">
                <ZoomIn className="h-4 w-4 mr-1" />
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4" />
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
                <div className="text-lg font-semibold">{inspection.branch ?? "N/A"}</div>
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

          {/* Thermal Image Comparison */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thermal Image Comparison</h3>
              <Button variant="outline" size="sm">
                <ZoomIn className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Baseline Image */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={baselineImage.image_url || "/placeholder.svg"}
                      alt="Baseline thermal image"
                      className="w-full h-80 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-blue-600">Baseline</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                      {formatDate(baselineImage.upload_date)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Image */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={currentImage.image_url || "/placeholder.svg"}
                      alt="Current thermal image"
                      className="w-full h-80 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-600">Current</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="destructive" className="bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Anomaly Detected
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
                      {formatDate(currentImage.upload_date)}
                    </div>

                    {/* Anomaly annotations */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-24 h-16 border-2 border-red-500 bg-red-500/20 rounded"></div>
                    </div>
                    <div className="absolute bottom-1/3 right-1/4">
                      <div className="w-16 h-12 border-2 border-red-500 bg-red-500/20 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Annotation Tools */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Annotation Tools</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
