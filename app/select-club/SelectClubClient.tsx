'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Building2, Globe } from 'lucide-react'
import { theme } from '../components/theme'
import { selectScope } from '@/lib/scope/actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import type { AccessibleClub } from './actions'

const T = theme

export default function SelectClubClient({ clubs, canViewCompany }: { clubs: AccessibleClub[]; canViewCompany: boolean }) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const busy = useRef(false)

  async function handleSelect(value: string) {
    if (busy.current) return
    busy.current = true
    setSubmitting(value)
    setError('')
    try { await selectScope(value) }
    catch { setError('Could not open that club. Check your access or refresh and retry.') }
    finally { busy.current = false; setSubmitting(null) }
  }

  return <main style={{ minHeight: '100vh', background: T.colors.bg }}>
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: T.colors.textPrimary, margin: 0 }}>
          {clubs.length === 1 ? 'Your club' : 'Choose your club'}
        </h1>
        <p style={{ fontSize: '14px', color: T.colors.textSecondary, marginTop: '8px' }}>
          {canViewCompany ? 'Open a club or view the entire company.' : 'Select an assigned club to open its dashboard.'}
        </p>
      </header>

      {canViewCompany && <button type="button" onClick={() => handleSelect(COMPANY_SCOPE)} disabled={submitting !== null}
        style={{ ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '14px 20px' }}>
        <Globe size={18} aria-hidden="true" />
        {submitting === COMPANY_SCOPE ? 'Opening company…' : 'View Entire Company'}
      </button>}

      {error && <p role="alert" style={{ color: T.colors.red }}>{error}</p>}
      {clubs.length === 0 ? <div style={{ ...T.card, padding: '28px' }} role="status">
        <Building2 size={24} color={T.colors.textMuted} aria-hidden="true" />
        <p style={{ color: T.colors.textPrimary, fontWeight: 600 }}>No active clubs available</p>
        <p style={{ color: T.colors.textSecondary, fontSize: '14px' }}>
          {canViewCompany ? 'Add or activate a club in Club Settings.' : 'Ask Head Office to assign a club to your account.'}
        </p>
      </div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px' }}>
        {clubs.map(club => <button key={club.id} type="button" onClick={() => handleSelect(club.id)}
          disabled={submitting !== null} aria-label={`Open ${club.name}`}
          style={{ ...T.card, margin: 0, padding: '24px', textAlign: 'left', cursor: submitting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '16px', color: T.colors.textPrimary,
            opacity: submitting && submitting !== club.id ? 0.55 : 1, minHeight: '104px' }}>
          <Building2 size={24} color={T.colors.red} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '16px', fontWeight: 600, overflowWrap: 'anywhere' }}>{club.name}</span>
            <span style={{ display: 'block', fontSize: '12px', color: T.colors.textSecondary, marginTop: '6px' }}>
              {submitting === club.id ? 'Opening dashboard…' : 'Open club dashboard'}
            </span>
          </span>
          <ArrowRight size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
        </button>)}
      </div>}
      <p role="status" aria-live="polite" style={{ fontSize: '13px', color: T.colors.textSecondary }}>
        {submitting ? 'Opening your selection…' : ''}
      </p>
    </div>
  </main>
}
