'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Building2, Globe } from 'lucide-react'
import { theme } from '../components/theme'
import { selectScope } from '@/lib/scope/actions'
import { COMPANY_SCOPE } from '@/lib/scope/constants'
import type { ClubLocation } from './actions'

const T = theme

const ClubMap = dynamic(() => import('./ClubMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '480px', borderRadius: T.radius.lg, background: T.colors.surface,
      border: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: T.colors.textMuted, fontSize: '13px',
    }}>
      Loading map…
    </div>
  ),
})

export default function SelectClubClient({ clubs, canViewCompany }: { clubs: ClubLocation[]; canViewCompany: boolean }) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const isMultiClub = clubs.length > 1
  const locatedClubs = clubs.filter(c => c.latitude != null && c.longitude != null)

  async function handleSelect(value: string) {
    setSubmitting(value)
    setError('')
    try { await selectScope(value) }
    catch { setError('Could not open that club. Check your access or refresh and retry.') }
    finally { setSubmitting(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.colors.bg }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 36px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: T.colors.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            {isMultiClub ? 'Choose where to start' : 'Your club'}
          </h1>
          <p style={{ fontSize: '13px', color: T.colors.textSecondary, marginTop: '6px' }}>
            {isMultiClub
              ? (canViewCompany ? 'Choose a club or view the entire company.' : 'Choose one of your assigned clubs.')
              : 'Click your club on the map to continue.'}
          </p>
        </div>

        {canViewCompany && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => handleSelect(COMPANY_SCOPE)}
              disabled={submitting !== null}
              style={{
                ...T.btn.primary, display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 24px', opacity: submitting ? 0.6 : 1,
              }}
            >
              <Globe size={15} />
              {submitting === COMPANY_SCOPE ? 'Loading…' : 'View Entire Company'}
            </button>
          </div>
        )}

        {error && <p role="alert" style={{ color: '#ff9999' }}>{error}</p>}
        {clubs.length === 0 && <p role="status">No active clubs are assigned to your account. Ask Head Office to assign a club.</p>}
        {locatedClubs.length === 0 ? (
          <div style={{
            ...T.card, textAlign: 'center', padding: '48px 24px',
          }}>
            <Building2 size={24} color={T.colors.textMuted} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: T.colors.textSecondary, margin: '0 0 6px', fontWeight: 600 }}>
              No club locations set yet
            </p>
            <p style={{ fontSize: '12px', color: T.colors.textMuted, margin: 0 }}>
              Add latitude/longitude for your clubs to see them on the map here.
            </p>
            {!isMultiClub && clubs[0] && (
              <button
                onClick={() => handleSelect(clubs[0].id)}
                style={{ ...T.btn.secondary, marginTop: '16px' }}
              >
                Continue to {clubs[0].name}
              </button>
            )}
          </div>
        ) : (
          <ClubMap clubs={locatedClubs} onSelect={handleSelect} submitting={submitting} />
        )}

      </div>
    </div>
  )
}
