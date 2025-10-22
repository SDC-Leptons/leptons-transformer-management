"use client"

import { Settings, Zap, Wrench } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Transformer",
      href: "/transformers",
      icon: Zap,
      current: pathname === "/" || pathname === "/transformers" || pathname.startsWith("/transformers"),
    },
    {
      name: "Maintenance",
      href: "/maintenances",
      icon: Wrench,
      current: pathname === "/maintenances" || pathname.startsWith("/maintenances"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/transformers" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
            <span className="text-sm font-bold">O</span>
          </div>
          <span className="text-lg font-semibold">versight</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.current ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
