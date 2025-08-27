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
  {
    id: 2,
    inspection_no: "000123590",
    transformer_id: 2,
    inspected_date: "2023-07-01T18:22:00Z",
    maintenance_date: null,
    status: "In Progress",
    inspector_name: "A-110",
    branch: "Nugegoda",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    inspection_no: "000123591",
    transformer_id: 3,
    inspected_date: "2023-06-13T12:12:00Z",
    maintenance_date: null,
    status: "Pending",
    inspector_name: "A-110",
    branch: "Nugegoda",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

let nextId = 4

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transformer_id = searchParams.get("transformer_id")
    const status = searchParams.get("status")

    let filteredInspections = [...inspections]

    if (transformer_id) {
      filteredInspections = filteredInspections.filter((i) => i.transformer_id === Number.parseInt(transformer_id))
    }

    if (status && status !== "All Time") {
      filteredInspections = filteredInspections.filter((i) => i.status === status)
    }

    return NextResponse.json(filteredInspections)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transformer_id, inspected_date, inspector_name, branch, notes } = body

    // Validate required fields
    if (!transformer_id || !inspected_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate inspection number
    const inspection_no = `000${123589 + nextId}`

    const newInspection = {
      id: nextId++,
      inspection_no,
      transformer_id: Number.parseInt(transformer_id),
      inspected_date,
      maintenance_date: null,
      status: "Pending",
      inspector_name: inspector_name || "",
      branch: branch || "",
      notes: notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    inspections.push(newInspection)

    return NextResponse.json(newInspection, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 })
  }
}
