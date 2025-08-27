"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Transformer } from "@/lib/types"

interface AddInspectionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  transformers: Transformer[]
}


const AddInspectionModal: React.FC<AddInspectionModalProps> = ({ open, onClose, onSubmit, transformers }) => {
  const [formData, setFormData] = useState({
    branch: "",
    transformer_no: "",
    transformer_no_search: "",
    inspected_date: "",
    maintainance_date: "",
    inspection_no: "",
    status: "Pending",
  })
  const [transformerLocked, setTransformerLocked] = useState(false)
  const [existingInspectionNumbers, setExistingInspectionNumbers] = useState<string[]>([])
  const [warning, setWarning] = useState("")

  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/inspections")
        .then((res) => res.json())
        .then((data) => {
          setExistingInspectionNumbers(data.map((i: any) => i.inspectionNumber?.toLowerCase?.() || ""))
        })
        .catch(() => setExistingInspectionNumbers([]))
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const enteredNo = formData.inspection_no.trim().toLowerCase()
    if (existingInspectionNumbers.includes(enteredNo)) {
      setWarning("Inspection number already exists. Please enter a unique number.")
      return
    }
    setWarning("")
    onSubmit({
      transformer_no: formData.transformer_no,
      inspected_date: formData.inspected_date,
      maintainance_date: formData.maintainance_date,
      branch: formData.branch,
      inspection_no: formData.inspection_no,
    })
    setFormData({
      branch: "",
      transformer_no: "",
      transformer_no_search: "",
      inspected_date: "",
      maintainance_date: "",
      inspection_no: "",
      status: "Pending",
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      if (field === "transformer_no") {
        const selectedTransformer = transformers.find(t => t && t.transformer_no === value);
        setTransformerLocked(true);
        const now = new Date();
        const currentDate = now.toISOString().split("T")[0];
        return {
          ...prev,
          transformer_no: value,
          transformer_no_search: value,
          branch: selectedTransformer && selectedTransformer.region ? selectedTransformer.region : "",
          inspected_date: prev.inspected_date === "" ? currentDate : prev.inspected_date,
          maintainance_date: prev.maintainance_date === "" ? currentDate : prev.maintainance_date,
        };
      }
      if (field === "transformer_no_search") {
        setTransformerLocked(false);
        return { ...prev, transformer_no_search: value, transformer_no: "" };
      }
      return { ...prev, [field]: value ?? "" };
    });
    if (field === "inspection_no" && warning) {
      setWarning("")
    }
  }

  const now = new Date()
  const currentDate = now.toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            New Inspection
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inspection_no">Inspection No</Label>
            <Input
              id="inspection_no"
              value={formData.inspection_no}
              onChange={(e) => handleChange("inspection_no", e.target.value)}
              placeholder="Enter inspection number"
              required
            />
            {warning && (
              <div className="text-red-600 text-xs mt-1">{warning}</div>
            )}
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select value={formData.branch} onValueChange={(value) => handleChange("branch", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
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
              value={formData.transformer_no}
              onChange={(e) => handleChange("transformer_no", e.target.value)}
              placeholder="Enter transformer number"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspected_date">Date of Inspection</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="inspected_date"
                  type="date"
                  value={formData.inspected_date || currentDate}
                  onChange={(e) => handleChange("inspected_date", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maintainance_date">Maintainance Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="maintainance_date"
                  type="date"
                  value={formData.maintainance_date || currentDate}
                  onChange={(e) => handleChange("maintainance_date", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || "Pending"} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
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

export default AddInspectionModal
