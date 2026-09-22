'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { theme } from '../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    // This redirectTo is the whole fix — without it, Supabase falls back to
    // the Site URL with the token in the hash and nothing to catch it.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ ...T.card, width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: T.colors.textPrimary, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Reset your password
        </h1>
        <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: '0 0 24px' }}>
          Enter your account email and we'll send you a reset link.
        </p>

        {status === 'sent' ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', borderRadius: T.radius.md, background: T.colors.greenGlow, border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle2 size={16} color={T.colors.green} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: 0 }}>
              If an account exists for <strong style={{ color: T.colors.textPrimary }}>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@virginactive.co.za"
                style={{ ...T.input, paddingLeft: '36px' }}
              />
            </div>

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: T.radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} color={T.colors.redStatus} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button type="submit" disabled={status === 'sending'} style={{ ...T.btn.primary, opacity: status === 'sending' ? 0.6 : 1 }}>
              {status === 'sending' ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}