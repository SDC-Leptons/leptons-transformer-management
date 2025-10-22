import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/${params.id}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch maintenance record')
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance record' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/maintenance/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update maintenance record')
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/${params.id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete maintenance record')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance record' },
      { status: 500 }
    )
  }
}
