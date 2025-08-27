import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, replace with actual database connection
const transformers = [
  {
    id: 1,
    transformer_no: "AZ-8890",
    pole_no: "EN-122-A",
    region: "Nugegoda",
    location_details: "Keels, Embuldeniya",
    type: "Bulk",
    capacity: 102.97,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const transformer = transformers.find((t) => t.id === id)

    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    return NextResponse.json(transformer)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transformer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const transformerIndex = transformers.findIndex((t) => t.id === id)

    if (transformerIndex === -1) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    const updatedTransformer = {
      ...transformers[transformerIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    transformers[transformerIndex] = updatedTransformer

    return NextResponse.json(updatedTransformer)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update transformer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const transformerIndex = transformers.findIndex((t) => t.id === id)

    if (transformerIndex === -1) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 })
    }

    transformers.splice(transformerIndex, 1)

    return NextResponse.json({ message: "Transformer deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete transformer" }, { status: 500 })
  }
}
