import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch maintenance records')
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create maintenance record')
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}
