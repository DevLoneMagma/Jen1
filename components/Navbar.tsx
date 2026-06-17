'use client'
// components/Navbar.tsx
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Bell, User } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(10,10,10,0.97)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(12px)' : 'blur(3px)',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04)' : 'none',
      }}
    >
      <a href="/" className="flex-shrink-0 select-none" aria-label="Jen1 home">
        <Image
          src="/jen1-logo.svg"
          alt="Jen1"
          width={72}
          height={72}
          priority
          className="h-9 w-auto object-contain"
        />
      </a>

      <div className="flex-1 flex justify-center px-4 md:px-8">
        <SearchBar />
      </div>

      <div className="flex items-center gap-1">
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/08 transition-all" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/08 transition-all" aria-label="Profile">
          <User size={17} />
        </button>
      </div>
    </nav>
  )
}
