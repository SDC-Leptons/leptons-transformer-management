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
  defaultTransformerNo?: string
}


const AddInspectionModal: React.FC<AddInspectionModalProps> = ({ open, onClose, onSubmit, transformers, defaultTransformerNo }) => {
  const [formData, setFormData] = useState({
    branch: "",
    transformer_no: "",
    inspected_date: "",
    maintainance_date: "",
    status: "Pending",
  })
  const [searchInput, setSearchInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Pre-select transformer if defaultTransformerNo is provided
  useEffect(() => {
    if (open && defaultTransformerNo) {
      const selectedTransformer = transformers.find(t => t && t.transformer_no === defaultTransformerNo);
      if (selectedTransformer) {
        const now = new Date();
        const currentDate = now.toISOString().split("T")[0];
        
        setFormData({
          branch: selectedTransformer.region || "",
          transformer_no: defaultTransformerNo,
          inspected_date: currentDate,
          maintainance_date: currentDate,
          status: "Pending",
        });
        
        // Set search input to just the number part
        setSearchInput(defaultTransformerNo.replace(/^T-/, ''));
        setValidationError("");
      }
    } else if (!open) {
      // Reset form when modal closes
      setFormData({
        branch: "",
        transformer_no: "",
        inspected_date: "",
        maintainance_date: "",
        status: "Pending",
      });
      setSearchInput("");
      setValidationError("");
    }
  }, [open, defaultTransformerNo, transformers]);

  // Filter transformers based on search (only search the number part after "T-")
  const filteredTransformers = transformers.filter(t => {
    if (!t || !t.transformer_no) return false;
    // Extract the number part after "T-"
    const numberPart = t.transformer_no.replace(/^T-/, '');
    return numberPart.includes(searchInput);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that selected transformer exists
    const isValid = transformers.some(t => t && t.transformer_no === formData.transformer_no);
    if (!isValid) {
      setValidationError("Please select a valid transformer from the list");
      return;
    }
    
    setValidationError("");
    
    // Backend will auto-generate inspectionNumber
    onSubmit({
      transformer_no: formData.transformer_no,
      inspected_date: formData.inspected_date,
      maintainance_date: formData.maintainance_date,
      branch: formData.branch,
      status: formData.status || "Pending", // Default to "Pending" if not selected
    })
    
    // Form will be reset by useEffect when modal closes
  }

  const handleTransformerSelect = (transformerNo: string) => {
    const selectedTransformer = transformers.find(t => t && t.transformer_no === transformerNo);
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    
    setFormData(prev => ({
      ...prev,
      transformer_no: transformerNo,
      branch: selectedTransformer?.region || prev.branch || "",
      inspected_date: prev.inspected_date || currentDate,
      maintainance_date: prev.maintainance_date || currentDate,
    }));
    
    // Set search input to just the number part
    setSearchInput(transformerNo.replace(/^T-/, ''));
    setShowDropdown(false);
    setValidationError("");
  }

  const handleSearchChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setSearchInput(numericValue);
    setShowDropdown(true);
    
    // Check if the full transformer number exists
    const fullTransformerNo = `T-${numericValue}`;
    const exists = transformers.some(t => t && t.transformer_no === fullTransformerNo);
    
    if (numericValue && exists) {
      handleTransformerSelect(fullTransformerNo);
    } else if (numericValue) {
      setFormData(prev => ({ ...prev, transformer_no: "" }));
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
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
            <Label htmlFor="transformer_no">Transformer No <span className="text-red-500">*</span></Label>
            <div className="relative">
              <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="px-3 py-2 text-gray-500 bg-gray-100 border-r">T-</span>
                <input
                  type="text"
                  value={formData.transformer_no ? formData.transformer_no.replace(/^T-/, '') : searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type transformer number"
                  className="flex-1 px-3 py-2 outline-none rounded-r-md"
                  required
                />
              </div>
              
              {showDropdown && filteredTransformers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredTransformers.map((transformer) => (
                    <div
                      key={transformer.id}
                      onClick={() => handleTransformerSelect(transformer.transformer_no)}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{transformer.transformer_no}</div>
                      <div className="text-sm text-gray-500">
                        {transformer.region} - {transformer.pole_no}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.transformer_no && (
                <div className="mt-1 text-sm text-green-600">
                  ✓ Selected: {formData.transformer_no}
                </div>
              )}
              
              {validationError && (
                <div className="mt-1 text-sm text-red-600">
                  {validationError}
                </div>
              )}
            </div>
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
                <SelectValue placeholder="Pending (Default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
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

export default AddInspectionModal
