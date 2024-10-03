import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(request: Request) {
  const booking = await request.json()

  const { data, error } = await supabase
    .from('bookings')
    .insert([booking])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Booking created successfully', data })
}