'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, User, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getAvailableSlots, createBooking } from '@/app/actions/booking'
import { formatDisplayDate, formatDisplayTime } from '@/lib/format'

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function getAvailableDates(availableDays: string[], daysAhead = 42): string[] {
  const dayNums = new Set(availableDays.map((d) => DAY_MAP[d]))
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (dayNums.has(d.getDay())) dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${m.toString().padStart(2, '0')} ${period}`
}

type Business = {
  id: string
  name: string
  slug: string
  available_days: string[]
  start_time: string
  end_time: string
  duration: number
  price: string | null
}

export function BookingForm({ business }: { business: Business }) {
  const router = useRouter()
  const timeSectionRef = useRef<HTMLElement>(null)
  const detailsSectionRef = useRef<HTMLElement>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const availableDates = getAvailableDates(business.available_days)

  async function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setError(null)
    setSlotsLoading(true)

    // Scroll to time section immediately so user sees the loading state
    setTimeout(() => {
      timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    const available = await getAvailableSlots(
      business.id, date, business.start_time, business.end_time, business.duration
    )
    setSlots(available)
    setSlotsLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return
    setError(null)
    startTransition(async () => {
      const result = await createBooking({
        business_id: business.id,
        business_name: business.name,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        date: selectedDate,
        time_slot: selectedSlot,
      })
      if (result.success) {
        router.push(
          `/book/${business.slug}/success?date=${selectedDate}&time=${selectedSlot}&name=${encodeURIComponent(name)}`
        )
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.')
      }
    })
  }

  const step = !selectedDate ? 1 : !selectedSlot ? 2 : 3

  return (
    <div className="flex flex-col gap-8">
      {/* Step 1 — Date */}
      <section>
        <StepHeader
          number={1}
          icon={<CalendarDays className="size-4" />}
          title="Select a Date"
          done={!!selectedDate}
          summary={selectedDate ? formatDisplayDate(selectedDate) : undefined}
        />
        {availableDates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No available dates.</p>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7">
            {availableDates.map((date) => {
              const { weekday, day, month } = shortDate(date)
              const isSelected = selectedDate === date
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`flex flex-col items-center rounded-xl border py-3 text-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-foreground hover:border-foreground/30 hover:bg-accent'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {weekday}
                  </span>
                  <span className="mt-0.5 text-base font-bold leading-none">{day}</span>
                  <span className={`mt-0.5 text-xs ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {month}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Step 2 — Time */}
      {selectedDate && (
        <>
          <Separator />
          <section ref={timeSectionRef} className="scroll-mt-6">
            <StepHeader
              number={2}
              icon={<Clock className="size-4" />}
              title="Select a Time"
              done={!!selectedSlot}
              summary={selectedSlot ? formatTime(selectedSlot) : undefined}
            />
            {slotsLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading available times…
              </div>
            ) : slots.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No slots available for this date. Please choose another day.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot)
                      setTimeout(() => {
                        detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 50)
                    }}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      selectedSlot === slot
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-foreground hover:border-foreground/30 hover:bg-accent'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Step 3 — Details */}
      {selectedDate && selectedSlot && (
        <>
          <Separator />
          <section ref={detailsSectionRef} className="scroll-mt-6">
            <StepHeader
              number={3}
              icon={<User className="size-4" />}
              title="Your Details"
              done={false}
            />
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              {/* Booking summary chip */}
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{formatDisplayDate(selectedDate)}</span>
                <span className="text-muted-foreground">·</span>
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{formatTime(selectedSlot)}</span>
                {business.price && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium">{business.price}</span>
                  </>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cname">Full Name</Label>
                <Input
                  id="cname"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email{' '}
                  <span className="font-normal text-muted-foreground">
                    (optional — for confirmation)
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className="mt-1 w-full gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}

function StepHeader({
  number,
  icon,
  title,
  done,
  summary,
}: {
  number: number
  icon: React.ReactNode
  title: string
  done: boolean
  summary?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          done
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {done ? icon : number}
      </div>
      <div>
        <p className="font-semibold leading-none">{title}</p>
        {summary && (
          <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p>
        )}
      </div>
    </div>
  )
}
