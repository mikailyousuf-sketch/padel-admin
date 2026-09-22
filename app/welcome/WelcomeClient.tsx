'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '../components/theme'

const T = theme

export default function WelcomeClient({ name }: { name: string }) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 80)
    const advanceTimer = setTimeout(() => router.push('/select-club'), 2200)
    return () => { clearTimeout(showTimer); clearTimeout(advanceTimer) }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', background: T.colors.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,10,9,0.08) 0%, transparent 65%)',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      <div style={{
        textAlign: 'center', position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <div style={{
          width: '4px', height: '4px', borderRadius: '50%', background: T.colors.red,
          margin: '0 auto 18px', boxShadow: T.shadow.redGlowSm,
        }} />
        <p style={{
          fontSize: '12px', color: T.colors.textMuted, textTransform: 'uppercase',
          letterSpacing: '0.14em', fontWeight: 600, margin: '0 0 10px',
        }}>
          Welcome back
        </p>
        <h1 style={{
          fontSize: '32px', fontWeight: 700, color: T.colors.textPrimary,
          margin: 0, letterSpacing: '-0.02em',
        }}>
          {name}
        </h1>
      </div>
    </div>
  )
}