"use client"

import React from "react"
import { GlobeLive } from "@/components/ui/component"

export default function GlobeLiveDemo() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-[#05040a] p-8 overflow-hidden">
      <div className="w-full max-w-lg">
        <GlobeLive />
      </div>
    </div>
  )
}
