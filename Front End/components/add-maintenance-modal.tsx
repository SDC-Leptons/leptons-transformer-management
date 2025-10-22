"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Calendar, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { CreateMaintenanceRequest, ElectricalReadings } from "@/lib/types"

interface AddMaintenanceModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateMaintenanceRequest) => void
  defaultInspectionNumber?: string
}

import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { useMemo } from "react"
import type { Inspection } from "@/lib/types"

const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  open,
  onClose,
  onSubmit,
  defaultInspectionNumber,
}) => {
  const [formData, setFormData] = useState<CreateMaintenanceRequest>({
    inspectionNumber: "",
    inspectorName: "",
    status: "pending",
    electricalReadings: {},
    recommendedActions: "",
    additionalRemarks: "",
  })
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [inspectionSearch, setInspectionSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [electricalReadingKey, setElectricalReadingKey] = useState("")
  const [electricalReadingValue, setElectricalReadingValue] = useState("")
  const [validationError, setValidationError] = useState("")

  // Fetch inspections on open (directly from backend, not via route)
  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/inspections")
        .then((res) => res.json())
        .then((data) => setInspections(data))
        .catch(() => setInspections([]))
    }
  }, [open])

  // Reset form when modal opens/closes or default inspection number changes
  useEffect(() => {
    if (open) {
      setFormData({
        inspectionNumber: defaultInspectionNumber || "",
        inspectorName: "",
        status: "pending",
        electricalReadings: {},
        recommendedActions: "",
        additionalRemarks: "",
      })
      setElectricalReadingKey("")
      setElectricalReadingValue("")
      setInspectionSearch("")
      setValidationError("")
    }
  }, [open, defaultInspectionNumber])

  // When inspectionNumber changes, auto-fill inspectorName
  useEffect(() => {
    if (formData.inspectionNumber) {
      const selected = inspections.find(
        (i) => {
          const num = (i as any).inspection_no || (i as any).inspectionNumber;
          return num === formData.inspectionNumber;
        }
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          inspectorName: (selected as any).inspector_name || (selected as any).inspectorName || (selected as any).inspector || "",
        }))
        setValidationError("") // Always clear error when valid
      } else {
        setFormData((prev) => ({ ...prev, inspectorName: "" }))
        setValidationError("Please select a valid inspection.")
      }
    } else {
      setFormData((prev) => ({ ...prev, inspectorName: "" }))
      setValidationError("") // Also clear error if input is cleared
    }
  }, [formData.inspectionNumber, inspections])

  const filteredInspections = useMemo(() => {
    if (!inspectionSearch) return inspections
    return inspections.filter((i) => {
      const num = (i as any).inspection_no || (i as any).inspectionNumber;
      return (num || "").toLowerCase().includes(inspectionSearch.toLowerCase())
    })
  }, [inspections, inspectionSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData);
  }

  const handleChange = (field: keyof CreateMaintenanceRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addElectricalReading = () => {
    if (electricalReadingKey.trim() && electricalReadingValue.trim()) {
      const numericValue = parseFloat(electricalReadingValue)
      setFormData((prev) => ({
        ...prev,
        electricalReadings: {
          ...prev.electricalReadings,
          [electricalReadingKey]: isNaN(numericValue) ? electricalReadingValue : numericValue,
        },
      }))
      setElectricalReadingKey("")
      setElectricalReadingValue("")
    }
  }

  const removeElectricalReading = (key: string) => {
    setFormData((prev) => {
      const newReadings = { ...prev.electricalReadings }
      delete newReadings[key]
      return { ...prev, electricalReadings: newReadings }
    })
  }

  // Quick add common electrical readings
  const addCommonReading = (key: string, placeholder: string) => {
    setElectricalReadingKey(key)
    // Focus on the value input
    setTimeout(() => {
      const valueInput = document.getElementById('reading-value-input') as HTMLInputElement
      if (valueInput) valueInput.focus()
    }, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            New Maintenance Record
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="inspectionNumber">
              Inspection Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <input
                type="text"
                value={formData.inspectionNumber || inspectionSearch || ""}
                onChange={e => {
                  setInspectionSearch(e.target.value)
                  setShowDropdown(true)
                  handleChange("inspectionNumber", "")
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type inspection number"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              {showDropdown && filteredInspections.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredInspections.map((inspection) => {
                    const inspectionNum = (inspection as any).inspection_no || (inspection as any).inspectionNumber;
                    const inspectorName = (inspection as any).inspector_name || (inspection as any).inspectorName || (inspection as any).inspector;
                    return (
                      <div
                        key={inspectionNum || (inspection as any).id || Math.random()}
                        onClick={() => {
                          if (inspectionNum) {
                            handleChange("inspectionNumber", inspectionNum)
                            setInspectionSearch(inspectionNum)
                            setShowDropdown(false)
                            setValidationError("") // Clear error immediately
                          }
                        }}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">
                          {inspectionNum || <span className="text-red-500">No Inspection Number</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inspectorName ? inspectorName : (<span className="italic text-gray-400">No Inspector</span>)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {formData.inspectionNumber && (
                <div className="mt-1 text-sm text-green-600">
                  ✓ Selected: {formData.inspectionNumber}
                </div>
              )}
              {validationError && (
                <div className="mt-1 text-sm text-red-600">{validationError}</div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="inspectorName">
              Inspector Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="inspectorName"
              type="text"
              value={formData.inspectorName}
              disabled
              placeholder="Auto-filled from inspection"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Electrical Readings</Label>
            <div className="mt-2 space-y-2">
              {/* Quick add buttons for common readings */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonReading("voltage", "220")}
                >
                  + Voltage (V)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonReading("current", "10.5")}
                >
                  + Current (A)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonReading("power", "2310")}
                >
                  + Power (W)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonReading("frequency", "50")}
                >
                  + Frequency (Hz)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonReading("resistance", "0.5")}
                >
                  + Resistance (Ω)
                </Button>
              </div>

              {/* Manual add reading */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Reading name (e.g., voltage)"
                  value={electricalReadingKey}
                  onChange={(e) => setElectricalReadingKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  id="reading-value-input"
                  type="text"
                  placeholder="Value"
                  value={electricalReadingValue}
                  onChange={(e) => setElectricalReadingValue(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addElectricalReading()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addElectricalReading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display added readings */}
              {Object.keys(formData.electricalReadings).length > 0 && (
                <div className="mt-3 space-y-1 p-3 bg-gray-50 rounded-md border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Added Readings:</div>
                  {Object.entries(formData.electricalReadings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center bg-white p-2 rounded border"
                    >
                      <span className="text-sm">
                        <strong>{key}:</strong> {value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElectricalReading(key)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="recommendedActions">Recommended Actions</Label>
            <Textarea
              id="recommendedActions"
              value={formData.recommendedActions}
              onChange={(e) => handleChange("recommendedActions", e.target.value)}
              placeholder="Replace oil filter, check bushings..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="additionalRemarks">Additional Remarks</Label>
            <Textarea
              id="additionalRemarks"
              value={formData.additionalRemarks}
              onChange={(e) => handleChange("additionalRemarks", e.target.value)}
              placeholder="Minor oil leak detected on the top cover..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              Create Maintenance Record
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMaintenanceModal
