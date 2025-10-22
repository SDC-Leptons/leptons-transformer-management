
import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    // Proxy to real backend
    const url = new URL(request.url)
    const params = url.search ? url.search : ''
    const response = await fetch(`${API_BASE_URL}/api/inspections${params}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error('Failed to fetch inspections from backend')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 })
  }
}

// Optionally, you can implement POST to proxy to backend as well if needed.
