"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to transformers page as the main entry point
    router.replace("/transformers")
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting to transformers...</p>
    </div>
  )
}
