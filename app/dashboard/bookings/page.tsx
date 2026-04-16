import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/server'
import { LogoutButton } from '@/components/logout-button'
import { getMyBusiness } from '@/app/actions/business'
import { getMyBookingsPaginated } from '@/app/actions/booking'
import { BookingsTable } from './bookings-table'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 20

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'No-show', value: 'no-show' },
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/auth/login')

  const business = await getMyBusiness()
  if (!business) redirect('/dashboard')

  const params = await searchParams
  const status = FILTERS.find((f) => f.value === params.status)?.value ?? 'all'
  const page = Math.max(1, parseInt(params.page ?? '1'))

  const { bookings, total, totalPages } = await getMyBookingsPaginated(business.id, {
    page,
    status,
    pageSize: PAGE_SIZE,
  })

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="min-h-svh flex flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold tracking-tight">Scheduva</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Bookings</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {data.claims.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total > 0 ? `${total} booking${total !== 1 ? 's' : ''}` : 'No bookings yet'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-1.5 flex-wrap">
          {FILTERS.map(({ label, value }) => (
            <Link
              key={value}
              href={`/dashboard/bookings?status=${value}&page=1`}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <BookingsTable key={`${status}-${page}`} initialBookings={bookings} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <Link href={`/dashboard/bookings?status=${status}&page=${page - 1}`}>
                    <ChevronLeft className="size-4" /> Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="gap-1">
                  <ChevronLeft className="size-4" /> Previous
                </Button>
              )}
              <span className="min-w-16 text-center text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <Link href={`/dashboard/bookings?status=${status}&page=${page + 1}`}>
                    Next <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="gap-1">
                  Next <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
