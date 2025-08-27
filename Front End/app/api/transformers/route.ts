// Handle baseline image upload for a transformer
import { writeFile } from "fs/promises"
import path from "path"

export async function POST_baselineImage(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get("baselineImage");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const id = Number(params.id);
    const transformer = transformers.find((t) => t.id === id);
    if (!transformer) {
      return NextResponse.json({ error: "Transformer not found" }, { status: 404 });
    }
    // Save file to public/baseline-images/{id}_{filename}
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${id}_${file.name}`;
    const filePath = path.join(process.cwd(), "public", "baseline-images", fileName);
    await writeFile(filePath, buffer);
    // Save the image URL to the transformer record (mock)
    transformer.baseline_image_url = `/baseline-images/${fileName}`;
    transformer.updated_at = new Date().toISOString();
    return NextResponse.json({ message: "Baseline image uploaded", url: transformer.baseline_image_url });
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload baseline image" }, { status: 500 });
  }
}
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
    baseline_image_url: "",
  },
  {
    id: 2,
    transformer_no: "AZ-1949",
    pole_no: "EN-122-A",
    region: "Nugegoda",
    location_details: "Main Road Junction",
    type: "Bulk",
    capacity: 150.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    baseline_image_url: "",
  },
]

let nextId = 3

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get("region")
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let filteredTransformers = [...transformers]

    if (region && region !== "All Regions") {
      filteredTransformers = filteredTransformers.filter((t) => t.region === region)
    }

    if (type && type !== "All Types") {
      filteredTransformers = filteredTransformers.filter((t) => t.type === type)
    }

    if (search) {
      filteredTransformers = filteredTransformers.filter(
        (t) =>
          t.transformer_no.toLowerCase().includes(search.toLowerCase()) ||
          t.pole_no.toLowerCase().includes(search.toLowerCase()) ||
          t.region.toLowerCase().includes(search.toLowerCase()),
      )
    }

    return NextResponse.json(filteredTransformers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transformers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transformer_no, pole_no, region, location_details, type, capacity } = body

    // Validate required fields
    if (!transformer_no || !pole_no || !region || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if transformer_no already exists
    const existingTransformer = transformers.find((t) => t.transformer_no === transformer_no)
    if (existingTransformer) {
      return NextResponse.json({ error: "Transformer number already exists" }, { status: 409 })
    }

    const newTransformer = {
      id: nextId++,
      transformer_no,
      pole_no,
      region,
      location_details: location_details || "",
      type,
      capacity: capacity || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      baseline_image_url: "",
    }

    transformers.push(newTransformer)

    return NextResponse.json(newTransformer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transformer" }, { status: 500 })
  }
}
