import { notFound } from 'next/navigation'
import { Clock, CalendarDays, DollarSign, Timer } from 'lucide-react'
import { getBusinessBySlug } from '@/app/actions/booking'
import { BookingForm } from './booking-form'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) notFound()

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const p = h >= 12 ? 'PM' : 'AM'
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${dh}:${m.toString().padStart(2, '0')} ${p}`
  }

  return (
    <div className="min-h-svh bg-muted/40">
      {/* Top bar */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-2xl px-4 py-5">
          {/* Logo dot */}
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <CalendarDays className="size-5 text-primary-foreground" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>

          {/* Info pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            <InfoPill icon={<CalendarDays className="size-3.5" />}>
              {business.available_days.join(', ')}
            </InfoPill>
            <InfoPill icon={<Clock className="size-3.5" />}>
              {formatTime(business.start_time)} – {formatTime(business.end_time)}
            </InfoPill>
            <InfoPill icon={<Timer className="size-3.5" />}>
              {business.duration < 60
                ? `${business.duration} min`
                : `${business.duration / 60} hr`}
              {' '}sessions
            </InfoPill>
            {business.price && (
              <InfoPill icon={<DollarSign className="size-3.5" />}>
                {business.price}
              </InfoPill>
            )}
          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/10 shadow-sm">
          <BookingForm business={business} />
        </div>
      </div>
    </div>
  )
}

function InfoPill({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}
