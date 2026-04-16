import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Link2,
  UserX,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/server'
import { LogoutButton } from '@/components/logout-button'
import { SetupForm } from './setup-form'
import { CopyLink } from './copy-link'
import { getMyBusiness } from '@/app/actions/business'
import { getBookingStats } from '@/app/actions/booking'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/auth/login')

  const business = await getMyBusiness()
  const stats = business ? await getBookingStats(business.id) : null

  return (
    <div className="min-h-svh flex flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <CalendarDays className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Scheduva</span>
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
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {business
              ? `Manage ${business.name}`
              : 'Set up your business to get started'}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Booking link */}
          {business && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Link2 className="size-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Your Booking Link</CardTitle>
                      <CardDescription className="mt-0.5">
                        Share this with customers to let them book
                      </CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                    <Link href={`/book/${business.slug}`} target="_blank">
                      <ExternalLink className="size-3.5" />
                      Preview
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CopyLink slug={business.slug} />
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Overview
                </h2>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-sm">
                  <Link href="/dashboard/bookings">View all bookings →</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  href="/dashboard/bookings?status=all&page=1"
                  icon={<Users className="size-4" />}
                  label="Total"
                  value={stats.total}
                  iconClass="bg-muted text-muted-foreground"
                />
                <StatCard
                  href="/dashboard/bookings?status=upcoming&page=1"
                  icon={<CalendarDays className="size-4" />}
                  label="Upcoming"
                  value={stats.upcoming}
                  iconClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  valueClass="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                  href="/dashboard/bookings?status=completed&page=1"
                  icon={<CheckCircle2 className="size-4" />}
                  label="Completed"
                  value={stats.completed}
                  iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  valueClass="text-emerald-600 dark:text-emerald-400"
                />
                <StatCard
                  href="/dashboard/bookings?status=no-show&page=1"
                  icon={<UserX className="size-4" />}
                  label="No-show"
                  value={stats.noShow}
                  iconClass="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                  valueClass="text-red-600 dark:text-red-400"
                />
              </div>
            </div>
          )}

          {/* Divider */}
          {business && <Separator />}

          {/* Setup form */}
          <SetupForm business={business} />
        </div>
      </main>
    </div>
  )
}

function StatCard({
  href,
  icon,
  label,
  value,
  iconClass = '',
  valueClass = '',
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number
  iconClass?: string
  valueClass?: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${valueClass}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}
