"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Eye, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ThermalImageComparison } from "@/components/thermal-image-comparison"
import { ImageWithAnomalies } from "@/components/image-with-anomalies"
import { ReferenceImageModal } from "@/components/reference-image-modal"
import { EditAnomalyModal } from "@/components/edit-anomaly-modal"
import type { ThermalImage } from "@/lib/types"

import type { Inspection } from "@/lib/types";
import Link from "next/link"
import { useParams } from "next/navigation"

export default function InspectionDetailPage() {
  const params = useParams()
  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [anomaliesLog, setAnomaliesLog] = useState<any[]>([])
  const [thermalImages, setThermalImages] = useState<ThermalImage[]>([])
  const [baselineImage, setBaselineImage] = useState<ThermalImage | null>(null)
  const [currentImage, setCurrentImage] = useState<ThermalImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [environmentalCondition, setEnvironmentalCondition] = useState("sunny")
  const [showComparison, setShowComparison] = useState(false)

  // Modal state for reference image upload
  const [showRefImageModal, setShowRefImageModal] = useState(false)
  
  // Modal state for editing anomaly
  const [showEditAnomalyModal, setShowEditAnomalyModal] = useState(false)
  const [editingAnomaly, setEditingAnomaly] = useState<any | null>(null)
  const [highlightedAnomalyId, setHighlightedAnomalyId] = useState<string | null>(null)

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
      // Parse anomalies JSON string if present
      let parsedAnomalies: any[] = [];
      if (data.anomalies) {
        try {
          parsedAnomalies = typeof data.anomalies === 'string' ? JSON.parse(data.anomalies) : data.anomalies;
          console.log('=== ANOMALIES DEBUG ===');
          console.log('Raw anomalies from backend:', data.anomalies);
          console.log('Parsed anomalies:', parsedAnomalies);
          if (parsedAnomalies.length > 0) {
            console.log('First anomaly box format [x1, y1, x2, y2]:', parsedAnomalies[0].box);
            console.log('First anomaly full data:', parsedAnomalies[0]);
          }
        } catch (e) {
          console.error('Failed to parse anomalies:', e);
          parsedAnomalies = [];
        }
      }
      setAnomalies(parsedAnomalies);
      // Parse anomaliesLog if present
      let parsedLogs: any[] = [];
      if (data.anomaliesLog) {
        try {
          parsedLogs = typeof data.anomaliesLog === 'string' ? JSON.parse(data.anomaliesLog) : data.anomaliesLog;
        } catch (e) {
          parsedLogs = [];
        }
      }
      setAnomaliesLog(parsedLogs);
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

  // Helpers for the Activity Log section
  const formatTimestamp = (ts?: string) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const getLogRowClasses = (entry: any) => {
    const action = String(entry?.action || '').toLowerCase()
    const madeBy = String(entry?.madeBy || '').toLowerCase()
    // 4 colors: add by AI (blue), add manually (green), edit (amber), delete (rose)
    if (action === 'add' && madeBy === 'ai') return 'bg-blue-50 border-blue-200'
    if (action === 'add') return 'bg-green-50 border-green-200'
    if (action === 'edit' || action === 'update') return 'bg-amber-50 border-amber-200'
    if (action === 'delete' || action === 'remove') return 'bg-rose-50 border-rose-200'
    return 'bg-gray-50 border-gray-200'
  }

  // Helper to check if a string is a valid image URL
  const isValidImage = (url?: string | null) => url && typeof url === "string" && url.trim() !== "";

  // Handle reference image upload with threshold
  const handleReferenceImageUpload = async ({ file, threshold }: { file: File; threshold: number }) => {
    const formData = new FormData();
    formData.append("refImage", file);
    formData.append("threshold", String(threshold));
    await fetch(`http://localhost:8080/api/inspections/${inspectionId}/refImage`, {
      method: "POST",
      body: formData,
    });
    // Refetch inspection data to update UI
    fetchInspection();
  };

  // Handle download anomalies as text file
  const handleDownloadAnomalies = () => {
    let content = `Inspection Anomalies Report\n`;
    content += `==============================\n\n`;
    content += `Inspection No: ${inspection?.inspection_no || 'N/A'}\n`;
    content += `Transformer No: ${inspection?.transformer_no || 'N/A'}\n`;
    content += `Inspection Date: ${inspection?.inspected_date || 'N/A'}\n`;
    content += `Status: ${inspection?.status || 'N/A'}\n`;
    content += `Generated: ${new Date().toLocaleString('en-GB')}\n\n`;

    content += `==============================\n`;
    content += `CURRENT ANOMALIES\n`;
    content += `==============================\n\n`;

    if (anomalies && anomalies.length > 0) {
      anomalies.forEach((anomaly, idx) => {
        content += `Anomaly #${idx + 1}\n`;
        content += `  ID: ${anomaly.id || 'N/A'}\n`;
        content += `  Class: ${anomaly.class || 'Unknown'}\n`;
        content += `  Confidence: ${typeof anomaly.confidence === 'number' ? (anomaly.confidence * 100).toFixed(2) + '%' : 'N/A'}\n`;
        content += `  Made By: ${anomaly.madeBy || 'Unknown'}\n`;
        content += `  Bounding Box: [${Array.isArray(anomaly.box) ? anomaly.box.map((v: number) => v.toFixed(2)).join(', ') : 'N/A'}]\n`;
        content += `\n`;
      });
    } else {
      content += `No current anomalies detected.\n\n`;
    }

    content += `==============================\n`;
    content += `ACTIVITY LOG\n`;
    content += `==============================\n\n`;

    if (anomaliesLog && anomaliesLog.length > 0) {
      anomaliesLog.forEach((entry, idx) => {
        content += `Log Entry #${idx + 1}\n`;
        content += `  Anomaly ID: ${entry.id || 'N/A'}\n`;
        content += `  Class: ${entry.class || 'Unknown'}\n`;
        content += `  Action: ${entry.action || 'N/A'}\n`;
        content += `  Made By: ${entry.madeBy || 'Unknown'}\n`;
        content += `  Confidence: ${typeof entry.confidence === 'number' ? (entry.confidence * 100).toFixed(2) + '%' : 'N/A'}\n`;
        content += `  Bounding Box: [${Array.isArray(entry.box) ? entry.box.map((v: number) => v.toFixed(2)).join(', ') : 'N/A'}]\n`;
        content += `  Timestamp: ${formatTimestamp(entry.timestamp)}\n`;
        content += `\n`;
      });
    } else {
      content += `No activity log entries.\n\n`;
    }

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomalies-${inspection?.inspection_no || inspectionId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle delete anomaly
  const handleDeleteAnomaly = async (anomalyId: string) => {
    try {
      await fetch(`http://localhost:8080/api/inspections/${inspectionId}/anomalies/${anomalyId}`, {
        method: "DELETE",
      });
      // Refetch inspection data to update UI
      fetchInspection();
    } catch (error) {
      console.error("Failed to delete anomaly:", error);
    }
  };

  // Handle edit anomaly
  const handleEditAnomaly = (anomaly: any) => {
    setEditingAnomaly(anomaly);
    setShowEditAnomalyModal(true);
  };

  // Handle update anomaly
  const handleUpdateAnomaly = async (updatedAnomaly: { box: [number, number, number, number]; class: string }) => {
    if (!editingAnomaly?.id) return;
    try {
      await fetch(`http://localhost:8080/api/inspections/${inspectionId}/anomalies/${editingAnomaly.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box: updatedAnomaly.box,
          class: updatedAnomaly.class,
          confidence: editingAnomaly.confidence, // Keep existing confidence
          madeBy: editingAnomaly.madeBy, // Keep existing madeBy
        }),
      });
      setShowEditAnomalyModal(false);
      setEditingAnomaly(null);
      // Refetch inspection data to update UI
      fetchInspection();
    } catch (error) {
      console.error("Failed to update anomaly:", error);
    }
  };

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
                  <div style={{ width: 400, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={inspection.baseline_image!}
                      alt="Baseline"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500 text-center">Baseline not available</div>
                )}
              </CardContent>
            </Card>

            {/* Ref Image Tile */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Image</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                {isValidImage(inspection.ref_image) ? (
                  <ImageWithAnomalies
                    imageUrl={inspection.ref_image!}
                    anomalies={anomalies}
                    onAnomalyAdded={async (anomaly) => {
                      // POST to backend
                      await fetch(`http://localhost:8080/api/inspections/${inspectionId}/anomalies`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(anomaly),
                      });
                      // Refetch anomalies
                      fetchInspection();
                    }}
                     onEditAnomaly={handleEditAnomaly}
                     onDeleteAnomaly={handleDeleteAnomaly}
                     highlightedAnomalyId={highlightedAnomalyId}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-gray-500 mb-2">No reference image uploaded</div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowRefImageModal(true)}>
                      Upload Reference Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Anomalies Section */}
          {anomalies && anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.filter(a => a.class !== 'Normal').map((anomaly, idx, arr) => {
                    const COLORS = [
                      '#ff5252', '#4caf50', '#2196f3', '#ff9800',
                      '#9c27b0', '#00bcd4', '#8bc34a', '#e91e63',
                    ];
                    const color = COLORS[idx % COLORS.length];
                    const isHighlighted = highlightedAnomalyId && anomaly.id && highlightedAnomalyId === anomaly.id;
                    return (
                    <div
                      key={anomaly.id || idx}
                      className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                        isHighlighted ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setHighlightedAnomalyId(anomaly.id || null)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span style={{
                          display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: color,
                        }} />
                        <span className="font-semibold">{anomaly.class}</span>
                        <span className="ml-3 text-sm text-gray-500">
                          Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="ml-3 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {anomaly.madeBy || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mr-4">
                        Box: [{anomaly.box.map((v: number) => v.toFixed(1)).join(', ')}]
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Edit"
                          onClick={(e) => { e.stopPropagation(); handleEditAnomaly(anomaly); }}
                          disabled={!anomaly.id}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                          </svg>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); anomaly.id && handleDeleteAnomaly(anomaly.id); }}
                          disabled={!anomaly.id}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </Button>
                        <Button variant="outline" size="sm" title="Refresh">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M1 20a11 11 0 0 0 17.9-4"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="M23 4a11 11 0 0 0-17.9 4"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  )})}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Log Section */}
          {anomaliesLog && anomaliesLog.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Log</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadAnomalies}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Anomalies
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">Added by AI</span>
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700">Added manually</span>
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-700">Edited</span>
                  <span className="px-2 py-1 rounded bg-rose-100 text-rose-700">Deleted</span>
                </div>
                <div className="space-y-2">
                  {anomaliesLog.map((entry, idx) => (
                    <div key={`${entry?.logId ?? ''}-${entry?.id ?? 'noid'}-${entry?.timestamp ?? 'notime'}-${entry?.action ?? 'noaction'}-${idx}`}
                         className={`p-3 rounded border ${getLogRowClasses(entry)}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-medium">{entry.class || '—'}</span>
                          <span className="text-xs text-gray-500">ID: {entry.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{entry.madeBy || 'user'}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{entry.action || 'change'}</span>
                          {typeof entry.confidence === 'number' && (
                            <span className="text-xs text-gray-500">Conf: {(entry.confidence * 100).toFixed(1)}%</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      {Array.isArray(entry.box) && entry.box.length === 4 && (
                        <div className="mt-2 text-xs text-gray-600">
                          Box: [{entry.box.map((v: number) => (typeof v === 'number' ? v.toFixed(2) : String(v))).join(', ')}]
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Reference Image Modal */}
        <ReferenceImageModal
          open={showRefImageModal}
          onClose={() => setShowRefImageModal(false)}
          onSubmit={handleReferenceImageUpload}
        />
        {/* Edit Anomaly Modal */}
        <EditAnomalyModal
          open={showEditAnomalyModal}
          onClose={() => {
            setShowEditAnomalyModal(false);
            setEditingAnomaly(null);
          }}
          onUpdate={handleUpdateAnomaly}
          imageUrl={inspection.ref_image || ''}
          anomaly={editingAnomaly}
        />
      </div>
    </div>
  )
}
