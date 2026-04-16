'use server'

import { createClient } from '@/lib/server'
import { sendBookingConfirmation } from '@/lib/email'

export type BookingStatus = 'upcoming' | 'completed' | 'no-show'

export type Booking = {
  id: string
  business_id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  date: string
  time_slot: string
  status: BookingStatus
  created_at: string
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  let current = startHour * 60 + startMin
  const end = endHour * 60 + endMin

  while (current + duration <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    current += duration
  }

  return slots
}

export async function getBusinessBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function getAvailableSlots(
  businessId: string,
  date: string,
  startTime: string,
  endTime: string,
  duration: number
): Promise<string[]> {
  const supabase = await createClient()

  const { data: takenSlots } = await supabase.rpc('get_taken_slots', {
    p_business_id: businessId,
    p_date: date,
  })

  const allSlots = generateTimeSlots(startTime, endTime, duration)
  const taken = new Set<string>(takenSlots || [])

  return allSlots.filter((slot) => !taken.has(slot))
}

export async function createBooking(data: {
  business_id: string
  business_name: string
  customer_name: string
  customer_phone: string
  customer_email: string
  date: string
  time_slot: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('bookings').insert({
    business_id: data.business_id,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_email: data.customer_email || null,
    date: data.date,
    time_slot: data.time_slot,
    status: 'upcoming',
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This slot was just taken. Please choose another time.' }
    }
    return { success: false, error: error.message }
  }

  if (data.customer_email) {
    sendBookingConfirmation({
      to: data.customer_email,
      customerName: data.customer_name,
      businessName: data.business_name,
      date: data.date,
      timeSlot: data.time_slot,
    }).catch(() => {})
  }

  return { success: true }
}

export async function getBookingStats(
  businessId: string
): Promise<{ total: number; upcoming: number; completed: number; noShow: number }> {
  const supabase = await createClient()

  const [{ count: total }, { count: upcoming }, { count: completed }, { count: noShow }] =
    await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'upcoming'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'completed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'no-show'),
    ])

  return {
    total: total ?? 0,
    upcoming: upcoming ?? 0,
    completed: completed ?? 0,
    noShow: noShow ?? 0,
  }
}

export async function getMyBookingsPaginated(
  businessId: string,
  {
    page = 1,
    status = 'all',
    pageSize = 20,
  }: { page?: number; status?: string; pageSize?: number }
): Promise<{ bookings: Booking[]; total: number; totalPages: number }> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('date', { ascending: false })
    .order('time_slot', { ascending: true })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count } = await query

  const total = count ?? 0
  return {
    bookings: data ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'completed' | 'no-show'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { success: false, error: 'Not authenticated' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, business_id')
    .eq('id', bookingId)
    .single()

  if (!booking) return { success: false, error: 'Booking not found' }
  if (booking.status !== 'upcoming') {
    return { success: false, error: 'Only upcoming bookings can be updated' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', booking.business_id)
    .eq('user_id', claimsData.claims.sub)
    .single()

  if (!business) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
