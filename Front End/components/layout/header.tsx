"use client"

import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "@/hooks/useUser"
import { toast } from "@/hooks/use-toast"

interface HeaderProps {
  title: string
  searchPlaceholder?: string
  onSearch?: (value: string) => void
}

export function Header({ title, searchPlaceholder, onSearch }: HeaderProps) {
  const router = useRouter()
  const { user } = useUser()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({ title: "Sign out failed", description: error.message })
      return
    }
    toast({ title: "Signed out" })
    router.replace("/login")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {searchPlaceholder && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              className="w-80 pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        <Button variant="ghost" size="sm">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>{user?.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">{user?.email?.split("@")[0] ?? "User"}</div>
            <div className="text-gray-500">{user?.email ?? ""}</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="ml-2">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
