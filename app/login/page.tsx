'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { theme } from '../components/theme'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/config/brand'

const T = theme

// Drop the real club crest at public/logo.png (or update BRAND.logoPath in
// lib/config/brand.ts) — falls back to a text mark automatically if that
// file isn't there yet, so the page never breaks while waiting on assets.
const LOGO_SRC = BRAND.logoPath

type Phase = 'intro' | 'settled'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('intro')
  const [logoError, setLogoError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setPhase('settled'), 1500)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)
    if (error) {
      setError(
        error.message.toLowerCase().includes('invalid')
          ? 'Incorrect email or password.'
          : error.message
      )
      return
    }

    // Deliberate: always through Welcome → club/company selection.
    // This is the intended flow, not a redirect bug.
    router.push('/welcome')
  }

  const settled = phase === 'settled'

  return (
    <div style={{
      minHeight: '100vh', background: T.colors.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', overflow: 'hidden', position: 'relative',
    }}>

      {/* Ambient glow field behind everything */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '900px', height: '900px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,10,9,0.10) 0%, transparent 65%)',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', maxWidth: '380px',
      }}>

        {/* ── Logo — spins and settles on load ── */}
        <div style={{
          width: settled ? '64px' : '120px',
          height: settled ? '64px' : '120px',
          marginBottom: settled ? '20px' : '0',
          transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1), height 0.6s cubic-bezier(0.16,1,0.3,1), margin-bottom 0.6s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            animation: phase === 'intro' ? 'logoSpinSettle 1.5s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            boxShadow: settled ? T.shadow.redGlowSm : '0 0 40px rgba(224,10,9,0.35), 0 0 80px rgba(224,10,9,0.15)',
            transition: 'box-shadow 0.6s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.colors.surface, border: `1px solid ${T.colors.border}`,
            overflow: 'hidden',
          }}>
            {!logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={LOGO_SRC}
                alt="Club logo"
                onError={() => setLogoError(true)}
                style={{ width: '70%', height: '70%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{
                color: T.colors.red, fontWeight: 800,
                fontSize: settled ? '20px' : '36px',
                transition: 'font-size 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}>{BRAND.name.charAt(0)}</span>
            )}
          </div>
        </div>

        {/* ── Brand line ── */}
        <div style={{
          textAlign: 'center', marginBottom: settled ? '32px' : '0',
          opacity: settled ? 1 : 0,
          maxHeight: settled ? '80px' : '0px',
          transition: 'opacity 0.5s ease 0.15s, margin-bottom 0.5s ease',
          overflow: 'hidden',
        }}>
          <p style={{ color: T.colors.red, fontWeight: 700, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
            {BRAND.name}
          </p>
          <p style={{ color: T.colors.textMuted, fontWeight: 500, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0' }}>
            {BRAND.productName}
          </p>
        </div>

        {/* ── Sign-in form — fades up once the logo has settled ── */}
        <div style={{
          width: '100%',
          opacity: settled ? 1 : 0,
          transform: settled ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s',
          pointerEvents: settled ? 'auto' : 'none',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                style={{ ...T.input, paddingLeft: '36px' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{ ...T.input, paddingLeft: '36px' }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
                borderRadius: T.radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <AlertCircle size={14} color={T.colors.redStatus} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: T.colors.textSecondary }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              ...T.btn.primary, marginTop: '4px', opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>

            <a href="/forgot-password" style={{
              fontSize: '12px', color: T.colors.textMuted, textAlign: 'center', marginTop: '4px', textDecoration: 'none',
            }}>
              Forgot your password?
            </a>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes logoSpinSettle {
          0%   { transform: rotate(0deg) scale(1.15); }
          100% { transform: rotate(1080deg) scale(1); }
        }
      `}</style>
    </div>
  )
}