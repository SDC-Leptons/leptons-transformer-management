import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface ReferenceImageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { file: File; threshold: number }) => void;
}

export const ReferenceImageModal: React.FC<ReferenceImageModalProps> = ({ open, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setThreshold(value[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    await onSubmit({ file: selectedFile, threshold });
    setSubmitting(false);
    setSelectedFile(null);
    setThreshold(0.5);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Reference Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={submitting}
          />
          <div>
            <label className="block mb-1 font-medium">Threshold: {threshold.toFixed(2)}</label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[threshold]}
              onValueChange={handleSliderChange}
              disabled={submitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {submitting ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
