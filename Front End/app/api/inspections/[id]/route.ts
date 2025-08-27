import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, replace with actual database connection
const inspections = [
  {
    id: 1,
    inspection_no: "000123589",
    transformer_id: 1,
    inspected_date: "2023-07-02T19:12:00Z",
    maintenance_date: null,
    status: "In Progress",
    inspector_name: "A-110",
    branch: "Nugegoda",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const inspection = inspections.find((i) => i.id === id)

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    return NextResponse.json(inspection)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inspection" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const inspectionIndex = inspections.findIndex((i) => i.id === id)

    if (inspectionIndex === -1) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
    }

    const updatedInspection = {
      ...inspections[inspectionIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    inspections[inspectionIndex] = updatedInspection

    return NextResponse.json(updatedInspection)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 })
  }
}
