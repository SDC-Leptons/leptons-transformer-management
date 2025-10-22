
"use client"

import type React from "react"
import { useState } from "react"
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
    pole_no: "",
    type: "",
    location_details: "",
    capacity: "",
  })
  const [baselineImage, setBaselineImage] = useState<File | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBaselineImage(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.region || !formData.pole_no || !formData.type) {
      alert("Please fill in all required fields: Region, Pole No, and Type");
      return;
    }
    
    onSubmit({
      ...formData,
      capacity: formData.capacity ? Number.parseFloat(formData.capacity) : undefined,
      baselineImage: baselineImage,
    })
    // Reset form
    setFormData({
      region: "",
      pole_no: "",
      type: "",
      location_details: "",
      capacity: "",
    })
    setBaselineImage(null)
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
            <Label htmlFor="region">Region <span className="text-red-500">*</span></Label>
            <Select value={formData.region} onValueChange={(value) => handleChange("region", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Region" />
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
            <Label htmlFor="pole_no">Pole No <span className="text-red-500">*</span></Label>
            <Input
              id="pole_no"
              placeholder="Pole No"
              value={formData.pole_no}
              onChange={(e) => handleChange("pole_no", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
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

          <div>
            <Label htmlFor="baselineImage">Baseline Image (Optional)</Label>
            <Input
              id="baselineImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {baselineImage && (
              <div className="text-xs text-gray-600 mt-1">Selected: {baselineImage.name}</div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
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
