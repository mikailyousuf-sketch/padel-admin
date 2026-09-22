'use client'

import { useState, useEffect } from 'react'
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { theme } from '../components/theme'
import { createClient } from '@/lib/supabase/client'

const T = theme

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Supabase's browser client auto-parses the #access_token=...&type=recovery
    // fragment on load (detectSessionInUrl defaults to true in createClient)
    // and fires this event once it's done.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Expired/used links come back with error info in the hash instead of a
    // token — no auth event fires for that case, so check for it directly.
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1))
      setLinkError(params.get('error_description')?.replace(/\+/g, ' ') || 'This reset link is invalid or has expired.')
    } else {
      // Fallback: some browsers process the hash before this effect runs —
      // if a session already exists a beat after mount, allow the form.
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
      })
    }

    return () => { listener.subscription.unsubscribe() }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setErrorMsg('Passwords do not match.'); return }

    setStatus('saving')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('done')
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ ...T.card, width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: T.colors.textPrimary, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Set a new password
        </h1>

        {linkError ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', borderRadius: T.radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginTop: '16px' }}>
            <AlertCircle size={16} color={T.colors.redStatus} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: '0 0 8px' }}>{linkError}</p>
              <a href="/forgot-password" style={{ fontSize: '12px', color: T.colors.red }}>Request a new link →</a>
            </div>
          </div>
        ) : status === 'done' ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', borderRadius: T.radius.md, background: T.colors.greenGlow, border: '1px solid rgba(34,197,94,0.25)', marginTop: '16px' }}>
            <CheckCircle2 size={16} color={T.colors.green} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: T.colors.textSecondary, margin: 0 }}>Password updated. Redirecting you in…</p>
          </div>
        ) : !ready ? (
          <p style={{ fontSize: '13px', color: T.colors.textMuted, marginTop: '16px' }}>Verifying your reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password" required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="New password" style={{ ...T.input, paddingLeft: '36px' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={T.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password" required minLength={8}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password" style={{ ...T.input, paddingLeft: '36px' }}
              />
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: T.radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} color={T.colors.redStatus} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '12px', color: T.colors.textSecondary, margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button type="submit" disabled={status === 'saving'} style={{ ...T.btn.primary, opacity: status === 'saving' ? 0.6 : 1 }}>
              {status === 'saving' ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}