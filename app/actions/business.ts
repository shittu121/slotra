'use server'

import { createClient } from '@/lib/server'

export type Business = {
  id: string
  user_id: string
  name: string
  slug: string
  available_days: string[]
  start_time: string
  end_time: string
  duration: number
  price: string | null
  created_at: string
}

export type BusinessFormData = {
  name: string
  available_days: string[]
  start_time: string
  end_time: string
  duration: number
  price: string
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).substring(2, 7)
  return `${base}-${suffix}`
}

export async function getMyBusiness(): Promise<Business | null> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return null

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', claimsData.claims.sub)
    .single()

  return data
}

export async function saveBusinessAction(
  formData: BusinessFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Not authenticated' }

  const userId = claimsData.claims.sub

  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('businesses')
      .update({
        name: formData.name,
        available_days: formData.available_days,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration: formData.duration,
        price: formData.price || null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const slug = generateSlug(formData.name)
    const { error } = await supabase.from('businesses').insert({
      user_id: userId,
      name: formData.name,
      slug,
      available_days: formData.available_days,
      start_time: formData.start_time,
      end_time: formData.end_time,
      duration: formData.duration,
      price: formData.price || null,
    })

    if (error) return { error: error.message }
  }

  return {}
}
