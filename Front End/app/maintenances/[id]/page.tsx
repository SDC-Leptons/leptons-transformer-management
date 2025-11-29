"use client"

import React, { useState, useEffect, useRef } from "react"
import { ArrowLeft, Trash2, Calendar, User, FileText, Zap, MapPin, Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
// Inline fallback for ImageWithAnomaliesReadOnly (original module missing)
interface ReadOnlyAnomaliesProps {
  imageUrl: string
  anomalies: any[]
  highlightedAnomalyId: string | null
}

const ImageWithAnomaliesReadOnly: React.FC<ReadOnlyAnomaliesProps> = ({ imageUrl, anomalies, highlightedAnomalyId }) => {
  const [imageSize, setImageSize] = useState<{ naturalWidth: number; naturalHeight: number; displayWidth: number; displayHeight: number; offsetX: number; offsetY: number } | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const CONTAINER_WIDTH = 400
  const CONTAINER_HEIGHT = 300

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    
    // Calculate scale to fit image in container while preserving aspect ratio
    const scaleX = CONTAINER_WIDTH / naturalWidth
    const scaleY = CONTAINER_HEIGHT / naturalHeight
    const scale = Math.min(scaleX, scaleY)
    
    const displayWidth = naturalWidth * scale
    const displayHeight = naturalHeight * scale
    
    // Center the image in the container
    const offsetX = (CONTAINER_WIDTH - displayWidth) / 2
    const offsetY = (CONTAINER_HEIGHT - displayHeight) / 2
    
    setImageSize({ naturalWidth, naturalHeight, displayWidth, displayHeight, offsetX, offsetY })
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, background: '#222', borderRadius: 8, overflow: 'hidden' }}>
      <img
        src={imageUrl}
        alt="Inspection"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onLoad={handleImageLoad}
      />
      {imageSize && anomalies.filter(a => a.class !== 'Normal').map((anomaly, idx) => {
        // Backend returns [x1, y1, x2, y2] format (corner coordinates)
        const [x1, y1, x2, y2] = anomaly.box || [0, 0, 0, 0]
        
        // Calculate width and height from corner coordinates
        const width = x2 - x1
        const height = y2 - y1
        
        // Calculate scale factor
        const scale = Math.min(imageSize.displayWidth / imageSize.naturalWidth, imageSize.displayHeight / imageSize.naturalHeight)
        
        // Scale to display coordinates and add offset
        const displayX = x1 * scale + imageSize.offsetX
        const displayY = y1 * scale + imageSize.offsetY
        const displayW = width * scale
        const displayH = height * scale
        
        const isHighlighted = highlightedAnomalyId && anomaly.id && highlightedAnomalyId === anomaly.id
        const colorPalette = ['#ff5252', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#8bc34a', '#e91e63']
        const color = colorPalette[idx % colorPalette.length]
        return (
          <div
            key={anomaly.id || idx}
            style={{
              position: 'absolute',
              left: displayX,
              top: displayY,
              width: displayW,
              height: displayH,
              border: `2px solid ${color}`,
              boxShadow: isHighlighted ? `0 0 0 2px ${color}, 0 0 10px 2px ${color}` : 'none',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -18,
                left: 0,
                background: color,
                color: '#fff',
                fontSize: 10,
                padding: '2px 4px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {anomaly.class} {(anomaly.confidence * 100).toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
import type { Maintenance, Inspection, WorkContentItem, VoltageCurrentReadings, BaseLineImagingNos, MeterDetails, FuseStatus } from "@/lib/types"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

// Extended Inspection type for this page
interface InspectionDetails extends Inspection {
  baseline_image?: string
  ref_image?: string
  anomalies?: any[]
  location_details?: string
}

// Transformer type for metadata display
interface TransformerDetails {
  id: number
  transformer_no: string
  pole_no: string
  region: string
  type: string
  status?: string
  capacity?: number
  baseline_image_url?: string
  location_details?: string
}

// Default work content items (4 rows as shown in the form) - lowercase to match backend
const defaultWorkContent: WorkContentItem[] = [
  { no: 1, c: false, ci: false, t: false, r: false, other: '', afterInspection: null, irNo: '' },
  { no: 2, c: false, ci: false, t: false, r: false, other: '', afterInspection: null, irNo: '' },
  { no: 3, c: false, ci: false, t: false, r: false, other: '', afterInspection: null, irNo: '' },
  { no: 4, c: false, ci: false, t: false, r: false, other: '', afterInspection: null, irNo: '' },
]

// Lowercase to match backend
const defaultPhaseReadings = { r: null, y: null, b: null }
const defaultVoltageCurrentReadings: VoltageCurrentReadings = {
  voltage: { ...defaultPhaseReadings },
  current: { ...defaultPhaseReadings }
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const maintenanceId = params.id as string

  const [maintenance, setMaintenance] = useState<Maintenance | null>(null)
  const [inspection, setInspection] = useState<InspectionDetails | null>(null)
  const [transformer, setTransformer] = useState<TransformerDetails | null>(null)
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [highlightedAnomalyId, setHighlightedAnomalyId] = useState<string | null>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state for editable fields
  const [formData, setFormData] = useState({
    branch: '',
    locationDetails: '',
    inspectionDate: '',
    inspectionTime: '',
    inspectedBy: '',
    baseLineImagingNos: { right: '', left: '', front: '' } as BaseLineImagingNos,
    lastMonthKVA: '',
    lastMonthDate: '',
    lastMonthTime: '',
    currentMonthKVA: '',
    baseLineCondition: '' as 'Sunny' | 'Cloudy' | 'Rainy' | 'Night' | '',
    transformerType: '' as 'Bulk' | 'Single Phase' | 'Three Phase' | '',
    meterDetails: { serial: '', meterCTRatio: '', make: '' } as MeterDetails,
    workContent: [...defaultWorkContent] as WorkContentItem[],
    firstInspectionReadings: { ...defaultVoltageCurrentReadings } as VoltageCurrentReadings,
    secondInspectionReadings: { ...defaultVoltageCurrentReadings } as VoltageCurrentReadings,
    afterThermalDate: '',
    afterThermalTime: '',
    fuseStatus: {
      fuse1: { ok: false },
      fuse2: { ok: false },
      fuse3: { ok: false },
      fuse4: { ok: false },
    },
    recommendedActions: '',
    additionalRemarks: '',
  })

  // Ref for PDF content
  const contentRef = useRef<HTMLDivElement>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Download PDF function
  const handleDownloadPdf = async () => {
    if (!contentRef.current || !maintenance) return
    
    setDownloadingPdf(true)
    
    try {
      // Dynamically import the libraries
      const { jsPDF } = await import('jspdf')
      const htmlToImage = await import('html-to-image')
      
      // Hide edit buttons and other interactive elements for PDF
      const editButtons = contentRef.current.querySelectorAll('[data-hide-in-pdf]')
      editButtons.forEach(el => (el as HTMLElement).style.display = 'none')
      
      // Use html-to-image which handles modern CSS better
      const dataUrl = await htmlToImage.toPng(contentRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: (node) => {
          // Skip iframes and videos
          if (node.tagName === 'IFRAME' || node.tagName === 'VIDEO') {
            return false
          }
          return true
        },
      })
      
      // Restore hidden elements
      editButtons.forEach(el => (el as HTMLElement).style.display = '')
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Create an image to get dimensions
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve) => { img.onload = resolve })
      
      const imgWidth = img.width
      const imgHeight = img.height
      
      const ratio = pdfWidth / imgWidth
      const scaledHeight = imgHeight * ratio
      
      // If content fits on one page
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, scaledHeight)
      } else {
        // Multi-page PDF
        let yPosition = 0
        const pageHeightInPixels = pdfHeight / ratio
        
        while (yPosition < imgHeight) {
          // Create a canvas to crop the image for this page
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = imgWidth
          pageCanvas.height = Math.min(pageHeightInPixels, imgHeight - yPosition)
          
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(
              img,
              0, yPosition,
              imgWidth, pageCanvas.height,
              0, 0,
              imgWidth, pageCanvas.height
            )
            
            const pageData = pageCanvas.toDataURL('image/png')
            
            if (yPosition > 0) {
              pdf.addPage()
            }
            
            pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pageCanvas.height * ratio)
          }
          
          yPosition += pageHeightInPixels
        }
      }
      
      // Download the PDF
      pdf.save(`${maintenance.maintenanceNumber}_Maintenance_Record.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

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
      
      // Parse the details object if it exists (backend returns nested details)
      const details = typeof data.details === 'string' ? JSON.parse(data.details) : (data.details || {})
      
      // Map created_at to timestamp and parse electricalReadings if needed
      data = {
        ...data,
        timestamp: data.created_at,
        electricalReadings: typeof data.electricalReadings === 'string' ? JSON.parse(data.electricalReadings) : (data.electricalReadings || {}),
        // Spread the details object fields into the main data object
        ...details,
        // Parse JSON fields from details if they're strings
        workContent: typeof details.workContent === 'string' ? JSON.parse(details.workContent) : (details.workContent || defaultWorkContent),
        baseLineImagingNos: typeof details.baseLineImagingNos === 'string' ? JSON.parse(details.baseLineImagingNos) : (details.baseLineImagingNos || { right: '', left: '', front: '' }),
        meterDetails: typeof details.meterDetails === 'string' ? JSON.parse(details.meterDetails) : (details.meterDetails || { serial: '', meterCTRatio: '', make: '' }),
        firstInspectionReadings: typeof details.firstInspectionReadings === 'string' ? JSON.parse(details.firstInspectionReadings) : (details.firstInspectionReadings || defaultVoltageCurrentReadings),
        secondInspectionReadings: typeof details.secondInspectionReadings === 'string' ? JSON.parse(details.secondInspectionReadings) : (details.secondInspectionReadings || defaultVoltageCurrentReadings),
        fuseStatus: typeof details.fuseStatus === 'string' ? JSON.parse(details.fuseStatus) : (details.fuseStatus || { fuse1: { ok: false }, fuse2: { ok: false }, fuse3: { ok: false }, fuse4: { ok: false } }),
      }
      console.log("Maintenance data after parsing:", data)
      console.log("Details object:", details)
      console.log("afterThermalDate:", data.afterThermalDate)
      console.log("workContent:", data.workContent)
      setMaintenance(data)
      
      // Populate form data from maintenance record (now includes details fields)
      const newFormData = {
        branch: data.branch || '',
        locationDetails: data.locationDetails || '',
        inspectionDate: data.inspectionDate || '',
        inspectionTime: data.inspectionTime || '',
        inspectedBy: data.inspectorName || '',
        baseLineImagingNos: data.baseLineImagingNos || { right: '', left: '', front: '' },
        lastMonthKVA: data.lastMonthKVA || '',
        lastMonthDate: data.lastMonthDate || '',
        lastMonthTime: data.lastMonthTime || '',
        currentMonthKVA: data.currentMonthKVA || '',
        baseLineCondition: data.baseLineCondition || '',
        transformerType: data.transformerType || '',
        meterDetails: data.meterDetails || { serial: '', meterCTRatio: '', make: '' },
        workContent: data.workContent || [...defaultWorkContent],
        firstInspectionReadings: data.firstInspectionReadings || { ...defaultVoltageCurrentReadings },
        secondInspectionReadings: data.secondInspectionReadings || { ...defaultVoltageCurrentReadings },
        afterThermalDate: data.afterThermalDate || '',
        afterThermalTime: data.afterThermalTime || '',
        fuseStatus: data.fuseStatus || { fuse1: { ok: false }, fuse2: { ok: false }, fuse3: { ok: false }, fuse4: { ok: false } },
        recommendedActions: data.recommendedActions || '',
        additionalRemarks: data.additionalRemarks || '',
      }
      console.log("Setting form data to:", newFormData)
      setFormData(newFormData)
      
      // Now fetch inspection details using inspectionNumber
      if (data.inspectionNumber) {
        await fetchInspectionDetails(data.inspectionNumber)
      }
      
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch maintenance:", error)
      setLoading(false)
    }
  }

  const fetchInspectionDetails = async (inspectionNumber: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/inspections/by-number/${inspectionNumber}`)
      if (!res.ok) {
        throw new Error("Failed to fetch inspection details")
      }
      const data = await res.json()
      const inspectionData: InspectionDetails = {
        ...data,
        transformer_no: data.transformerNumber,
        inspection_no: data.inspectionNumber,
        inspected_date: data.inspectionDate,
        maintainance_date: data.maintainanceDate,
        baseline_image: data.baselineImage,
        ref_image: data.refImage,
      }
      setInspection(inspectionData)
      
      // Auto-fill form data from inspection details if not already set
      setFormData(prev => ({
        ...prev,
        // Only fill if the field is empty (not already saved in maintenance)
        inspectionDate: prev.inspectionDate || (data.inspectionDate ? data.inspectionDate.split('T')[0] : ''),
        inspectedBy: prev.inspectedBy || data.inspectorName || '',
        branch: prev.branch || data.branch || '',
        locationDetails: prev.locationDetails || data.locationDetails || '',
      }))
      
      // Parse anomalies
      let parsedAnomalies: any[] = []
      if (data.anomalies) {
        try {
          parsedAnomalies = typeof data.anomalies === 'string' ? JSON.parse(data.anomalies) : data.anomalies
        } catch (e) {
          console.error('Failed to parse anomalies:', e)
          parsedAnomalies = []
        }
      }
      setAnomalies(parsedAnomalies)
      
      // Now fetch transformer details using transformerNumber
      if (data.transformerNumber) {
        await fetchTransformerDetails(data.transformerNumber)
      }
    } catch (error) {
      console.error("Failed to fetch inspection details:", error)
    }
  }

  const fetchTransformerDetails = async (transformerNumber: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/transformers/by-number/${transformerNumber}`)
      if (!res.ok) {
        throw new Error("Failed to fetch transformer details")
      }
      const data = await res.json()
      console.log("Transformer API response:", data)
      
      // The API may return an array or a single object, handle both cases
      const transformerObj = Array.isArray(data) ? data[0] : data
      
      if (!transformerObj) {
        console.error("No transformer found for number:", transformerNumber)
        return
      }
      
      const transformerData: TransformerDetails = {
        id: transformerObj.id,
        transformer_no: transformerObj.transformerNumber,
        pole_no: transformerObj.poleNumber,
        region: transformerObj.region,
        type: transformerObj.type,
        status: transformerObj.status,
        capacity: transformerObj.capacity,
        baseline_image_url: transformerObj.baselineImage,
        location_details: transformerObj.locationDetails,
      }
      console.log("Parsed transformer data:", transformerData)
      setTransformer(transformerData)
      
      // Auto-fill form data from transformer details if not already set
      setFormData(prev => ({
        ...prev,
        // Only fill if the field is empty (not already saved in maintenance)
        branch: prev.branch || transformerObj.region || '',
        locationDetails: prev.locationDetails || transformerObj.locationDetails || '',
        transformerType: prev.transformerType || transformerObj.type || '',
        currentMonthKVA: prev.currentMonthKVA || (transformerObj.capacity ? String(transformerObj.capacity) : ''),
      }))
    } catch (error) {
      console.error("Failed to fetch transformer details:", error)
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

  // Handle save form data
  const handleSave = async () => {
    setSaving(true)
    
    const payload = {
      // Top-level fields
      inspectorName: formData.inspectedBy,
      recommendedActions: formData.recommendedActions,
      additionalRemarks: formData.additionalRemarks,
      // Nested details object for all the inspection form fields
      details: {
        branch: formData.branch,
        locationDetails: formData.locationDetails,
        inspectionDate: formData.inspectionDate,
        inspectionTime: formData.inspectionTime,
        baseLineImagingNos: formData.baseLineImagingNos,
        lastMonthKVA: formData.lastMonthKVA,
        lastMonthDate: formData.lastMonthDate,
        lastMonthTime: formData.lastMonthTime,
        currentMonthKVA: formData.currentMonthKVA,
        baseLineCondition: formData.baseLineCondition,
        transformerType: formData.transformerType,
        meterDetails: formData.meterDetails,
        workContent: formData.workContent,
        firstInspectionReadings: formData.firstInspectionReadings,
        secondInspectionReadings: formData.secondInspectionReadings,
        afterThermalDate: formData.afterThermalDate,
        afterThermalTime: formData.afterThermalTime,
        fuseStatus: formData.fuseStatus,
      }
    }
    
    console.log("Saving payload:", JSON.stringify(payload, null, 2))
    
    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchMaintenance() // Refresh data
      } else {
        alert("Failed to save maintenance record")
      }
    } catch (error) {
      console.error("Failed to save maintenance:", error)
      alert("Failed to save maintenance record")
    } finally {
      setSaving(false)
    }
  }

  // Update work content item
  const updateWorkContent = (index: number, field: keyof WorkContentItem, value: any) => {
    console.log(`updateWorkContent called: index=${index}, field=${field}, value=${value}`)
    setFormData(prev => {
      const newWorkContent = [...prev.workContent]
      newWorkContent[index] = { ...newWorkContent[index], [field]: value }
      console.log("New workContent:", newWorkContent)
      return { ...prev, workContent: newWorkContent }
    })
  }

  // Update voltage/current readings (lowercase keys to match backend)
  const updateReadings = (
    readingType: 'firstInspectionReadings' | 'secondInspectionReadings',
    measureType: 'voltage' | 'current',
    phase: 'r' | 'y' | 'b',
    value: string
  ) => {
    console.log(`updateReadings called: ${readingType}.${measureType}.${phase} = ${value}`)
    const numValue = value === '' ? null : parseFloat(value)
    setFormData(prev => ({
      ...prev,
      [readingType]: {
        ...prev[readingType],
        [measureType]: {
          ...prev[readingType][measureType],
          [phase]: numValue
        }
      }
    }))
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

  // Helper to check if a string is a valid image URL
  const isValidImage = (url?: string | null) => url && typeof url === "string" && url.trim() !== "";

  // Anomaly colors for consistency
  const COLORS = [
    '#ff5252', '#4caf50', '#2196f3', '#ff9800',
    '#9c27b0', '#00bcd4', '#8bc34a', '#e91e63',
  ];

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
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        fetchMaintenance() // Reset form data
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    data-hide-in-pdf
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  data-hide-in-pdf
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  data-hide-in-pdf
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* PDF Content Container */}
          <div ref={contentRef}>
          {/* Transformer Metadata Section */}
          {transformer && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  Transformer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Transformer No</p>
                    <p className="font-semibold text-gray-900">
                      <Link href={`/transformers/${transformer.transformer_no}`} className="text-indigo-600 hover:underline">
                        {transformer.transformer_no}
                      </Link>
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Pole No</p>
                    <p className="font-semibold text-gray-900">{transformer.pole_no || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {transformer.region || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900">{transformer.type || '-'}</p>
                  </div>
                  {transformer.capacity && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-semibold text-gray-900">{transformer.capacity} kVA</p>
                    </div>
                  )}
                  {transformer.status && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-gray-900">{transformer.status}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inspection Details Section */}
          {inspection && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-600" />
                  Inspection Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Inspection No</p>
                    <p className="font-semibold text-gray-900">
                      <Link href={`/inspections/${inspection.inspection_no}`} className="text-indigo-600 hover:underline">
                        {inspection.inspection_no}
                      </Link>
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Transformer No</p>
                    <p className="font-semibold text-gray-900">{inspection.transformer_no}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Inspection Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(inspection.inspected_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Maintenance Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(inspection.maintainance_date)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Inspection Status</p>
                    <Badge variant="secondary" className={
                      inspection.status === 'Completed' ? 'bg-purple-100 text-purple-700' :
                      inspection.status === 'In Progress' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {inspection.status}
                    </Badge>
                  </div>
                  {inspection.inspector_name && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Inspector</p>
                      <p className="font-semibold text-gray-900">{inspection.inspector_name}</p>
                    </div>
                  )}
                  {inspection.branch && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Branch</p>
                      <p className="font-semibold text-gray-900">{inspection.branch}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thermal Images Section */}
          {inspection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Baseline Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Baseline Image</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                  {isValidImage(transformer?.baseline_image_url) ? (
                    <div style={{ width: 400, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                      <img
                        src={transformer!.baseline_image_url!}
                        alt="Baseline"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center">Baseline image not available</div>
                  )}
                </CardContent>
              </Card>

              {/* Reference Image with Anomalies (Read-Only) */}
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Image with Anomalies</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                  {isValidImage(inspection.ref_image) ? (
                    <ImageWithAnomaliesReadOnly
                      imageUrl={inspection.ref_image!}
                      anomalies={anomalies}
                      highlightedAnomalyId={highlightedAnomalyId}
                    />
                  ) : (
                    <div className="text-gray-500 text-center">Reference image not available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Anomalies List Section */}
          {anomalies && anomalies.filter(a => a.class !== 'Normal').length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.filter(a => a.class !== 'Normal').map((anomaly, idx) => {
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
                        <div className="text-sm text-gray-500">
                          Box: [{anomaly.box.map((v: number) => v.toFixed(1)).join(', ')}]
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thermal Image Inspection Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Thermal Image Inspection Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Debug: Show raw form data */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 p-2 bg-gray-100 rounded text-xs" data-hide-in-pdf>
                  <summary className="cursor-pointer font-semibold">Debug: Form Data</summary>
                  <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(formData, null, 2)}</pre>
                </details>
              )}
              {/* Basic Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  {isEditing ? (
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g., Nugegoda"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{formData.branch || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>Transformer No</Label>
                  <p className="mt-1 font-medium">{transformer?.transformer_no || inspection?.transformer_no || '-'}</p>
                </div>
                <div>
                  <Label>Pole No</Label>
                  <p className="mt-1 font-medium">{transformer?.pole_no || '-'}</p>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <Label htmlFor="locationDetails">Location Details</Label>
                {isEditing ? (
                  <Input
                    id="locationDetails"
                    value={formData.locationDetails}
                    onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                    placeholder="e.g., 'Kaelis', Embuldeniya"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formData.locationDetails || '-'}</p>
                )}
              </div>

              {/* Date, Time, Inspected By */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inspectionDate">Date of Inspection</Label>
                  {isEditing ? (
                    <Input
                      id="inspectionDate"
                      type="date"
                      value={formData.inspectionDate}
                      onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{formData.inspectionDate || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="inspectionTime">Time</Label>
                  {isEditing ? (
                    <Input
                      id="inspectionTime"
                      type="time"
                      value={formData.inspectionTime}
                      onChange={(e) => setFormData({ ...formData, inspectionTime: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{formData.inspectionTime || '-'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="inspectedBy">Inspected By</Label>
                  {isEditing ? (
                    <Input
                      id="inspectedBy"
                      value={formData.inspectedBy}
                      onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
                      placeholder="e.g., A-110"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{formData.inspectedBy || '-'}</p>
                  )}
                </div>
              </div>

              {/* Base Line Imaging nos (IR) */}
              <div>
                <Label className="text-base font-semibold">Base Line Imaging nos (IR)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="irRight">Right</Label>
                    {isEditing ? (
                      <Input
                        id="irRight"
                        value={formData.baseLineImagingNos.right}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          baseLineImagingNos: { ...prev.baseLineImagingNos, right: e.target.value }
                        }))}
                        placeholder="IR 02052"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{formData.baseLineImagingNos.right || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="irLeft">Left</Label>
                    {isEditing ? (
                      <Input
                        id="irLeft"
                        value={formData.baseLineImagingNos.left}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          baseLineImagingNos: { ...prev.baseLineImagingNos, left: e.target.value }
                        }))}
                        placeholder="IR 02053"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{formData.baseLineImagingNos.left || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="irFront">Front</Label>
                    {isEditing ? (
                      <Input
                        id="irFront"
                        value={formData.baseLineImagingNos.front}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          baseLineImagingNos: { ...prev.baseLineImagingNos, front: e.target.value }
                        }))}
                        placeholder="IR 00054"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{formData.baseLineImagingNos.front || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* kVA Readings Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Last Month */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label className="text-base font-semibold">(S.6.0) Last Month</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="lastMonthKVA">kVA</Label>
                      {isEditing ? (
                        <Input
                          id="lastMonthKVA"
                          value={formData.lastMonthKVA}
                          onChange={(e) => setFormData({ ...formData, lastMonthKVA: e.target.value })}
                          placeholder="IR 02052"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formData.lastMonthKVA || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastMonthDate">Date</Label>
                      {isEditing ? (
                        <Input
                          id="lastMonthDate"
                          type="date"
                          value={formData.lastMonthDate}
                          onChange={(e) => setFormData({ ...formData, lastMonthDate: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formData.lastMonthDate || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastMonthTime">Time</Label>
                      {isEditing ? (
                        <Input
                          id="lastMonthTime"
                          type="time"
                          value={formData.lastMonthTime}
                          onChange={(e) => setFormData({ ...formData, lastMonthTime: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formData.lastMonthTime || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Month */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label className="text-base font-semibold">(S.8.0) Current Month kVA</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="currentMonthKVA">kVA</Label>
                      {isEditing ? (
                        <Input
                          id="currentMonthKVA"
                          value={formData.currentMonthKVA}
                          onChange={(e) => setFormData({ ...formData, currentMonthKVA: e.target.value })}
                          placeholder="IR 03052"
                        />
                      ) : (
                        <p className="mt-1 font-medium">{formData.currentMonthKVA || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="baseLineCondition">Base Line Condition</Label>
                      {isEditing ? (
                        <Select
                          value={formData.baseLineCondition}
                          onValueChange={(value: 'Sunny' | 'Cloudy' | 'Rainy' | 'Night') => setFormData({ ...formData, baseLineCondition: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sunny">Sunny</SelectItem>
                            <SelectItem value="Cloudy">Cloudy</SelectItem>
                            <SelectItem value="Rainy">Rainy</SelectItem>
                            <SelectItem value="Night">Night</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-medium">{formData.baseLineCondition || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="transformerType">Transformer Type</Label>
                      {isEditing ? (
                        <Select
                          value={formData.transformerType}
                          onValueChange={(value: 'Bulk' | 'Single Phase' | 'Three Phase') => setFormData({ ...formData, transformerType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bulk">Bulk</SelectItem>
                            <SelectItem value="Single Phase">Single Phase</SelectItem>
                            <SelectItem value="Three Phase">Three Phase</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-medium">{formData.transformerType || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meter Details */}
              <div>
                <Label className="text-base font-semibold">Meter Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="meterSerial">Serial</Label>
                    {isEditing ? (
                      <Input
                        id="meterSerial"
                        value={formData.meterDetails.serial}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          meterDetails: { ...prev.meterDetails, serial: e.target.value }
                        }))}
                        placeholder="20400594"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{formData.meterDetails.serial || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="meterCTRatio">Meter CT Ratio</Label>
                    {isEditing ? (
                      <Input
                        id="meterCTRatio"
                        value={formData.meterDetails.meterCTRatio}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          meterDetails: { ...prev.meterDetails, meterCTRatio: e.target.value }
                        }))}
                        placeholder="300 / 5A"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{formData.meterDetails.meterCTRatio || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="meterMake">Make</Label>
                    {isEditing ? (
                      <Select
                        value={formData.meterDetails.make}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          meterDetails: { ...prev.meterDetails, make: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Microstep">Microstep</SelectItem>
                          <SelectItem value="Edmi">Edmi</SelectItem>
                          <SelectItem value="Landis+Gyr">Landis+Gyr</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 font-medium">{formData.meterDetails.make || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Content Table */}
              <div>
                <Label className="text-base font-semibold">Work Content</Label>
                <p className="text-xs text-gray-500 mb-2">C - Check, CI - Clean, T - Tight, R - Replace</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-center w-12">No</th>
                        <th className="border border-gray-300 p-2 text-center w-12">C</th>
                        <th className="border border-gray-300 p-2 text-center w-12">CI</th>
                        <th className="border border-gray-300 p-2 text-center w-12">T</th>
                        <th className="border border-gray-300 p-2 text-center w-12">R</th>
                        <th className="border border-gray-300 p-2 text-center">Other</th>
                        <th className="border border-gray-300 p-2 text-center" colSpan={2}>After Inspection Report</th>
                        <th className="border border-gray-300 p-2 text-center">IR No(s)</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1"></th>
                        <th className="border border-gray-300 p-1 text-xs">OK</th>
                        <th className="border border-gray-300 p-1 text-xs">NOT OK</th>
                        <th className="border border-gray-300 p-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.workContent.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-2 text-center">{item.no}</td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.c}
                                onCheckedChange={(checked) => updateWorkContent(idx, 'c', !!checked)}
                              />
                            ) : (
                              item.c ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.ci}
                                onCheckedChange={(checked) => updateWorkContent(idx, 'ci', !!checked)}
                              />
                            ) : (
                              item.ci ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.t}
                                onCheckedChange={(checked) => updateWorkContent(idx, 't', !!checked)}
                              />
                            ) : (
                              item.t ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.r}
                                onCheckedChange={(checked) => updateWorkContent(idx, 'r', !!checked)}
                              />
                            ) : (
                              item.r ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                value={item.other}
                                onChange={(e) => updateWorkContent(idx, 'other', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              item.other || '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.afterInspection === 'OK'}
                                onCheckedChange={(checked) => updateWorkContent(idx, 'afterInspection', checked ? 'OK' : null)}
                              />
                            ) : (
                              item.afterInspection === 'OK' ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Checkbox
                                checked={item.afterInspection === 'NOT_OK'}
                                onCheckedChange={(checked) => updateWorkContent(idx, 'afterInspection', checked ? 'NOT_OK' : null)}
                              />
                            ) : (
                              item.afterInspection === 'NOT_OK' ? '✓' : '-'
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                value={item.irNo}
                                onChange={(e) => updateWorkContent(idx, 'irNo', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              item.irNo || '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* After Thermal Date/Time */}
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-sm text-gray-600">After Thermal Date:</span>
                  {isEditing ? (
                    <>
                      <Input
                        type="date"
                        value={formData.afterThermalDate}
                        onChange={(e) => setFormData({ ...formData, afterThermalDate: e.target.value })}
                        className="w-40 h-8"
                      />
                      <Input
                        type="time"
                        value={formData.afterThermalTime}
                        onChange={(e) => setFormData({ ...formData, afterThermalTime: e.target.value })}
                        className="w-32 h-8"
                      />
                    </>
                  ) : (
                    <span className="font-medium">{formData.afterThermalDate || '-'} {formData.afterThermalTime || ''}</span>
                  )}
                </div>
              </div>

              {/* Voltage and Current Readings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Inspection */}
                <div className="p-4 border rounded-lg">
                  <Label className="text-base font-semibold">First Inspection Voltage and Current Readings</Label>
                  <table className="w-full mt-2 border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2 text-center bg-red-50">R</th>
                        <th className="border border-gray-300 p-2 text-center bg-yellow-50">Y</th>
                        <th className="border border-gray-300 p-2 text-center bg-blue-50">B</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">V</td>
                        {(['r', 'y', 'b'] as const).map((phase) => (
                          <td key={phase} className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={formData.firstInspectionReadings.voltage[phase] ?? ''}
                                onChange={(e) => updateReadings('firstInspectionReadings', 'voltage', phase, e.target.value)}
                                className="h-8 text-center"
                              />
                            ) : (
                              formData.firstInspectionReadings.voltage[phase] ?? '-'
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">I</td>
                        {(['r', 'y', 'b'] as const).map((phase) => (
                          <td key={phase} className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={formData.firstInspectionReadings.current[phase] ?? ''}
                                onChange={(e) => updateReadings('firstInspectionReadings', 'current', phase, e.target.value)}
                                className="h-8 text-center"
                              />
                            ) : (
                              formData.firstInspectionReadings.current[phase] ?? '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Second Inspection */}
                <div className="p-4 border rounded-lg">
                  <Label className="text-base font-semibold">Second Inspection Voltage and Current Readings</Label>
                  <table className="w-full mt-2 border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2 text-center bg-red-50">R</th>
                        <th className="border border-gray-300 p-2 text-center bg-yellow-50">Y</th>
                        <th className="border border-gray-300 p-2 text-center bg-blue-50">B</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">V</td>
                        {(['r', 'y', 'b'] as const).map((phase) => (
                          <td key={phase} className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={formData.secondInspectionReadings.voltage[phase] ?? ''}
                                onChange={(e) => updateReadings('secondInspectionReadings', 'voltage', phase, e.target.value)}
                                className="h-8 text-center"
                              />
                            ) : (
                              formData.secondInspectionReadings.voltage[phase] ?? '-'
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">I</td>
                        {(['r', 'y', 'b'] as const).map((phase) => (
                          <td key={phase} className="border border-gray-300 p-2 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={formData.secondInspectionReadings.current[phase] ?? ''}
                                onChange={(e) => updateReadings('secondInspectionReadings', 'current', phase, e.target.value)}
                                className="h-8 text-center"
                              />
                            ) : (
                              formData.secondInspectionReadings.current[phase] ?? '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fuse Status */}
              <div>
                <Label className="text-base font-semibold">Fuse Status</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {(['fuse1', 'fuse2', 'fuse3', 'fuse4'] as const).map((fuse, idx) => (
                    <div key={fuse} className="p-3 border rounded-lg text-center">
                      <Label>FUSE {idx + 1}</Label>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        {isEditing ? (
                          <Checkbox
                            checked={formData.fuseStatus[fuse].ok}
                            onCheckedChange={(checked) => {
                              console.log(`Fuse ${fuse} checkbox changed:`, checked, typeof checked)
                              const newValue = checked === true
                              console.log(`Setting ${fuse}.ok to:`, newValue)
                              setFormData(prev => {
                                const newState = {
                                  ...prev,
                                  fuseStatus: {
                                    ...prev.fuseStatus,
                                    [fuse]: { ok: newValue }
                                  }
                                }
                                console.log('New fuseStatus:', newState.fuseStatus)
                                return newState
                              })
                            }}
                          />
                        ) : null}
                        <span className={formData.fuseStatus[fuse].ok ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {formData.fuseStatus[fuse].ok ? '✓ OK' : 'Not OK'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <Label htmlFor="recommendedActions" className="text-base font-semibold">Recommended Actions</Label>
                {isEditing ? (
                  <Textarea
                    id="recommendedActions"
                    value={formData.recommendedActions}
                    onChange={(e) => setFormData({ ...formData, recommendedActions: e.target.value })}
                    placeholder="Enter recommended actions..."
                    rows={3}
                    className="mt-2"
                  />
                ) : (
                  <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.recommendedActions || 'No recommended actions specified'}</p>
                  </div>
                )}
              </div>

              {/* Additional Remarks */}
              <div>
                <Label htmlFor="additionalRemarks" className="text-base font-semibold">Additional Remarks</Label>
                {isEditing ? (
                  <Textarea
                    id="additionalRemarks"
                    value={formData.additionalRemarks}
                    onChange={(e) => setFormData({ ...formData, additionalRemarks: e.target.value })}
                    placeholder="Enter additional remarks..."
                    rows={3}
                    className="mt-2"
                  />
                ) : (
                  <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-200 min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.additionalRemarks || 'No additional remarks'}</p>
                  </div>
                )}
              </div>

              {/* Save/Edit Buttons at bottom */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        fetchMaintenance()
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
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
                  <p className="text-sm text-gray-600">Work Items</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formData.workContent.filter(w => w.c || w.ci || w.t || w.r).length} / {formData.workContent.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>{/* End PDF Content Container */}
        </div>
      </div>
    </div>
  )
}
