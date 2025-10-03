export interface Transformer {
  id: number
  transformer_no: string
  pole_no: string
  region: string
  location_details?: string
  type: string
  capacity?: number
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: number
  inspection_no: string
  transformer_no: string
  inspected_date: string
  maintainance_date: string 
  status: "Pending" | "In Progress" | "Completed"
  inspector_name?: string
  branch?: string
  notes?: string
  baseline_image?: string
  ref_image?: string
}

export interface ThermalImage {
  id: number
  transformer_no: string
  inspection_no: string
  image_type: "baseline" | "maintenance"
  image_url: string
  environmental_condition?: "sunny" | "cloudy" | "rainy"
  upload_date: string
  uploader_name?: string
  file_size?: number
  file_name?: string
  created_at: string
}

export interface CreateTransformerRequest {
  transformer_no: string
  pole_no: string
  region: string
  location_details?: string
  type: string
  capacity?: number
}

export interface CreateInspectionRequest {
  transformer_id: number
  inspected_date: string
  inspector_name?: string
  branch?: string
  notes?: string
}
