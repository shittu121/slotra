import Link from 'next/link'
import { CheckCircle2, CalendarDays, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDisplayDate, formatDisplayTime } from '@/lib/format'

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string; time?: string; name?: string }>
}) {
  const { slug } = await params
  const { date, time, name } = await searchParams

  return (
    <div className="min-h-svh bg-muted/40 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Success card */}
        <div className="rounded-2xl border bg-card p-8 ring-1 ring-foreground/10 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">You&apos;re booked!</h1>
          {name && (
            <p className="mt-2 text-muted-foreground">
              Thanks, <span className="font-medium text-foreground">{name}</span>. Your booking is confirmed.
            </p>
          )}

          {/* Booking details */}
          {date && time && (
            <div className="mt-6 rounded-xl border bg-muted/50 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold">{formatDisplayDate(date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-semibold">{formatDisplayTime(time)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-5 text-sm text-muted-foreground">
            If you need to reschedule or cancel, please contact us directly.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/book/${slug}`}>
                <ArrowLeft className="size-4" />
                Book Another Slot
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
