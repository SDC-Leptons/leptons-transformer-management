import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, replace with actual database connection
const thermalImages = [
  {
    id: 1,
    transformer_id: 1,
    inspection_id: 1,
    image_type: "baseline",
    image_url: "/thermal-baseline-blue.png",
    environmental_condition: "sunny",
    upload_date: new Date().toISOString(),
    uploader_name: "A-110",
    file_size: 2048576,
    file_name: "baseline_thermal_001.jpg",
    created_at: new Date().toISOString(),
  },
]

let nextId = 2

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transformer_id = searchParams.get("transformer_id")
    const inspection_id = searchParams.get("inspection_id")
    const image_type = searchParams.get("image_type")

    let filteredImages = [...thermalImages]

    if (transformer_id) {
      filteredImages = filteredImages.filter((img) => img.transformer_id === Number.parseInt(transformer_id))
    }

    if (inspection_id) {
      filteredImages = filteredImages.filter((img) => img.inspection_id === Number.parseInt(inspection_id))
    }

    if (image_type) {
      filteredImages = filteredImages.filter((img) => img.image_type === image_type)
    }

    return NextResponse.json(filteredImages)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch thermal images" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transformer_id, inspection_id, image_type, environmental_condition, uploader_name } = body

    // Validate required fields
    if (!transformer_id || !image_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Simulate file upload - in production, handle actual file upload
    const mockImageUrl = `/placeholder.svg?height=400&width=600&query=thermal ${image_type} image ${environmental_condition || "normal"} conditions`

    const newImage = {
      id: nextId++,
      transformer_id: Number.parseInt(transformer_id),
      inspection_id: inspection_id ? Number.parseInt(inspection_id) : null,
      image_type,
      image_url: mockImageUrl,
      environmental_condition: environmental_condition || null,
      upload_date: new Date().toISOString(),
      uploader_name: uploader_name || "",
      file_size: Math.floor(Math.random() * 5000000) + 1000000, // Random file size
      file_name: `${image_type}_thermal_${String(nextId).padStart(3, "0")}.jpg`,
      created_at: new Date().toISOString(),
    }

    thermalImages.push(newImage)

    return NextResponse.json(newImage, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload thermal image" }, { status: 500 })
  }
}
