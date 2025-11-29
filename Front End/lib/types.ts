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

export interface ElectricalReadings {
  voltage?: number
  current?: number
  power?: number
  frequency?: number
  resistance?: number
  [key: string]: any // Allow dynamic properties
}

// Voltage and Current readings for R, Y, B phases (lowercase to match backend)
export interface PhaseReadings {
  r: number | null
  y: number | null
  b: number | null
}

export interface VoltageCurrentReadings {
  voltage: PhaseReadings
  current: PhaseReadings
}

// Work content checklist item (lowercase to match backend)
export interface WorkContentItem {
  no: number
  c: boolean  // Check
  ci: boolean // Clean
  t: boolean  // Tight
  r: boolean  // Replace
  other: string
  afterInspection: 'OK' | 'NOT_OK' | null
  irNo: string
}

// Base line imaging references
export interface BaseLineImagingNos {
  right: string
  left: string
  front: string
}

// Meter details
export interface MeterDetails {
  serial: string
  meterCTRatio: string
  make: string
}

// Fuse status for each section
export interface FuseStatus {
  ok: boolean
}

export interface Maintenance {
  mid: number
  maintenanceNumber: string
  inspectionNumber: string
  inspectorName: string
  status: string
  electricalReadings: ElectricalReadings
  recommendedActions: string
  additionalRemarks: string
  timestamp: string
  // New expanded fields
  branch?: string
  locationDetails?: string
  inspectionDate?: string
  inspectionTime?: string
  baseLineImagingNos?: BaseLineImagingNos
  lastMonthKVA?: string
  lastMonthDate?: string
  lastMonthTime?: string
  currentMonthKVA?: string
  baseLineCondition?: 'Sunny' | 'Cloudy' | 'Rainy' | 'Night'
  transformerType?: 'Bulk' | 'Single Phase' | 'Three Phase'
  meterDetails?: MeterDetails
  workContent?: WorkContentItem[]
  firstInspectionReadings?: VoltageCurrentReadings
  secondInspectionReadings?: VoltageCurrentReadings
  afterThermalDate?: string
  afterThermalTime?: string
  fuseStatus?: {
    fuse1: FuseStatus
    fuse2: FuseStatus
    fuse3: FuseStatus
    fuse4: FuseStatus
  }
}

export interface CreateMaintenanceRequest {
  inspectionNumber: string
  inspectorName: string
  status: string
  electricalReadings: ElectricalReadings
  recommendedActions: string
  additionalRemarks: string
}

export interface UpdateMaintenanceRequest {
  inspectorName?: string
  status?: string
  electricalReadings?: ElectricalReadings
  recommendedActions?: string
  additionalRemarks?: string
  // New expanded fields
  branch?: string
  locationDetails?: string
  inspectionDate?: string
  inspectionTime?: string
  baseLineImagingNos?: BaseLineImagingNos
  lastMonthKVA?: string
  lastMonthDate?: string
  lastMonthTime?: string
  currentMonthKVA?: string
  baseLineCondition?: 'Sunny' | 'Cloudy' | 'Rainy' | 'Night'
  transformerType?: 'Bulk' | 'Single Phase' | 'Three Phase'
  meterDetails?: MeterDetails
  workContent?: WorkContentItem[]
  firstInspectionReadings?: VoltageCurrentReadings
  secondInspectionReadings?: VoltageCurrentReadings
  afterThermalDate?: string
  afterThermalTime?: string
  fuseStatus?: {
    fuse1: FuseStatus
    fuse2: FuseStatus
    fuse3: FuseStatus
    fuse4: FuseStatus
  }
}
