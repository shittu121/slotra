'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/book/${slug}`
      : `/book/${slug}`

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
      <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
        {url}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        className="shrink-0 gap-1.5"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}
