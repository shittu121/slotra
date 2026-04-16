'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  )
}
