'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveBusinessAction } from '@/app/actions/business'
import type { Business } from '@/app/actions/business'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const value = `${h.toString().padStart(2, '0')}:${m}`
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { value, label: `${dh}:${m} ${period}` }
})

export function SetupForm({ business }: { business: Business | null }) {
  const [name, setName] = useState(business?.name ?? '')
  const [days, setDays] = useState<string[]>(
    business?.available_days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  )
  const [startTime, setStartTime] = useState(business?.start_time ?? '09:00')
  const [endTime, setEndTime] = useState(business?.end_time ?? '17:00')
  const [duration, setDuration] = useState(String(business?.duration ?? 60))
  const [price, setPrice] = useState(business?.price ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleDay(day: string) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (days.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one available day.' })
      return
    }
    setSaving(true)
    setMessage(null)
    const result = await saveBusinessAction({
      name,
      available_days: days,
      start_time: startTime,
      end_time: endTime,
      duration: Number(duration),
      price,
    })
    setSaving(false)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully.' })
      setTimeout(() => window.location.reload(), 900)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{business ? 'Business Settings' : 'Set Up Your Business'}</CardTitle>
        <CardDescription>
          {business
            ? 'Update your availability and booking preferences.'
            : 'Configure your schedule to generate a public booking link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Business name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              placeholder="e.g. John's Guitar Lessons"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Available days */}
          <div className="grid gap-2.5">
            <Label>Available Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`h-9 w-14 rounded-lg border text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Session Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price */}
          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="price">
              Price{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="price"
              placeholder="e.g. $50 / session"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Feedback */}
          {message && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                message.type === 'error'
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-32">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : business ? (
                'Save Changes'
              ) : (
                'Create Booking Page'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
