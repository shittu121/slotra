'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Loader2, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateBookingStatus } from '@/app/actions/booking'
import type { Booking, BookingStatus } from '@/app/actions/booking'
import { formatDisplayDate, formatDisplayTime } from '@/lib/format'

const STATUS_VARIANT: Record<BookingStatus, 'upcoming' | 'completed' | 'noshow'> = {
  upcoming: 'upcoming',
  completed: 'completed',
  'no-show': 'noshow',
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  'no-show': 'No-show',
}

export function BookingsTable({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStatusUpdate(id: string, newStatus: 'completed' | 'no-show') {
    setError(null)
    setUpdatingId(id)
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    )

    startTransition(async () => {
      const result = await updateBookingStatus(id, newStatus)
      setUpdatingId(null)
      if (!result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'upcoming' } : b))
        )
        setError(result.error ?? 'Failed to update')
      }
    })
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CheckCircle2 className="size-6 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm font-medium">No bookings found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bookings matching this filter will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map((b) => {
              const isUpdating = updatingId === b.id && isPending
              return (
                <tr key={b.id} className="group bg-card transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{b.customer_name}</p>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        {b.customer_phone}
                      </span>
                      {b.customer_email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="size-3" />
                          {b.customer_email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm">{formatDisplayDate(b.date)}</td>
                  <td className="px-4 py-3.5 text-sm font-medium">{formatDisplayTime(b.time_slot)}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={STATUS_VARIANT[b.status]}>
                      {STATUS_LABEL[b.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {b.status === 'upcoming' && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b.id, 'completed')}
                          className="h-7 gap-1 border-emerald-200 px-2 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        >
                          {isUpdating ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(b.id, 'no-show')}
                          className="h-7 gap-1 border-red-200 px-2 text-xs text-red-700 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          {isUpdating ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <XCircle className="size-3" />
                          )}
                          No-show
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {bookings.map((b) => {
          const isUpdating = updatingId === b.id && isPending
          return (
            <div key={b.id} className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.customer_name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="size-3" />
                    {b.customer_phone}
                  </p>
                  {b.customer_email && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {b.customer_email}
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="text-sm">
                  <span className="font-medium">{formatDisplayDate(b.date)}</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatDisplayTime(b.time_slot)}</span>
                </div>
                {b.status === 'upcoming' && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleStatusUpdate(b.id, 'completed')}
                      className="h-7 gap-1 border-emerald-200 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50"
                    >
                      {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleStatusUpdate(b.id, 'no-show')}
                      className="h-7 gap-1 border-red-200 px-2.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3" />}
                      No-show
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
