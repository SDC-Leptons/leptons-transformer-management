
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface AddTransformerModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const AddTransformerModal: React.FC<AddTransformerModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    region: "",
    transformer_no: "",
    pole_no: "",
    type: "",
    location_details: "",
    capacity: "",
  })
  const [existingTransformerNumbers, setExistingTransformerNumbers] = useState<string[]>([])
  const [warning, setWarning] = useState("")

  useEffect(() => {
    // Fetch all transformer numbers when modal opens
    if (open) {
      fetch("http://localhost:8080/api/transformers")
        .then((res) => res.json())
        .then((data) => {
          setExistingTransformerNumbers(data.map((t: any) => t.transformerNumber?.toLowerCase?.() || ""))
        })
        .catch(() => setExistingTransformerNumbers([]))
    }
  }, [open])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // If the transformer_no is being changed, clear the warning
    if (field === "transformer_no" && warning) {
      setWarning("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const enteredNo = formData.transformer_no.trim().toLowerCase()
    if (existingTransformerNumbers.includes(enteredNo)) {
      setWarning("Transformer number already exists. Please enter a unique number.")
      return
    }
    setWarning("")
    onSubmit({
      ...formData,
      capacity: formData.capacity ? Number.parseFloat(formData.capacity) : undefined,
    })
    setFormData({
      region: "",
      transformer_no: "",
      pole_no: "",
      type: "",
      location_details: "",
      capacity: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add Transformer
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="region">Regions</Label>
            <Select value={formData.region} onValueChange={(value) => handleChange("region", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nugegoda">Nugegoda</SelectItem>
                <SelectItem value="Maharagama">Maharagama</SelectItem>
                <SelectItem value="Colombo">Colombo</SelectItem>
                <SelectItem value="Kandy">Kandy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transformer_no">Transformer No</Label>
            <Input
              id="transformer_no"
              placeholder="Transformer No"
              value={formData.transformer_no}
              onChange={(e) => handleChange("transformer_no", e.target.value)}
              required
            />
            {warning && (
              <div className="text-red-600 text-xs mt-1">{warning}</div>
            )}
          </div>

          <div>
            <Label htmlFor="pole_no">Pole No</Label>
            <Input
              id="pole_no"
              placeholder="Pole No"
              value={formData.pole_no}
              onChange={(e) => handleChange("pole_no", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bulk">Bulk</SelectItem>
                <SelectItem value="Distribution">Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location_details">Location Details</Label>
            <Textarea
              id="location_details"
              placeholder="Location Details"
              value={formData.location_details}
              onChange={(e) => handleChange("location_details", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacity (kVA)</Label>
            <Input
              id="capacity"
              type="number"
              step="0.01"
              placeholder="Capacity"
              value={formData.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={!!warning}>
              Confirm
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

export default AddTransformerModal
