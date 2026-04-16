'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateBookingStatus } from '@/app/actions/booking'
import type { Booking, BookingStatus } from '@/app/actions/booking'
import { formatDisplayDate, formatDisplayTime } from '@/lib/format'

type Filter = 'all' | BookingStatus

const STATUS_BADGE: Record<BookingStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  'no-show': 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  'no-show': 'No-show',
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'No-show', value: 'no-show' },
]

export function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  const counts: Record<Filter, number> = {
    all: bookings.length,
    upcoming: bookings.filter((b) => b.status === 'upcoming').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    'no-show': bookings.filter((b) => b.status === 'no-show').length,
  }

  function handleStatusUpdate(id: string, newStatus: 'completed' | 'no-show') {
    setError(null)
    setUpdatingId(id)

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    )

    startTransition(async () => {
      const result = await updateBookingStatus(id, newStatus)
      setUpdatingId(null)
      if (!result.success) {
        // Revert
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'upcoming' } : b))
        )
        setError(result.error ?? 'Failed to update status')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Bookings</CardTitle>
          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {label}
                {counts[value] > 0 && (
                  <span className="ml-1 opacity-70">({counts[value]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-3">{error}</p>
        )}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {filter === 'all' ? 'No bookings yet.' : `No ${filter} bookings.`}
          </p>
        ) : (
          <div className="divide-y rounded-md border overflow-hidden">
            {filtered.map((b) => {
              const isUpdating = updatingId === b.id && isPending
              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-3 bg-background"
                >
                  {/* Customer info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{b.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{b.customer_phone}</p>
                    {b.customer_email && (
                      <p className="text-xs text-muted-foreground truncate">{b.customer_email}</p>
                    )}
                  </div>

                  {/* Date & time */}
                  <div className="text-sm shrink-0">
                    <p className="font-medium">{formatDisplayDate(b.date)}</p>
                    <p className="text-muted-foreground">{formatDisplayTime(b.time_slot)}</p>
                  </div>

                  {/* Status badge + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[b.status]}`}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>

                    {b.status === 'upcoming' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b.id, 'completed')}
                          className="text-xs h-7 px-2 text-green-700 border-green-200 hover:bg-green-50"
                        >
                          {isUpdating ? '...' : 'Completed'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b.id, 'no-show')}
                          className="text-xs h-7 px-2 text-red-700 border-red-200 hover:bg-red-50"
                        >
                          {isUpdating ? '...' : 'No-show'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
