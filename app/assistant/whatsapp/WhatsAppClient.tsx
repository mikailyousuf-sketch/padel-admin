'use client'
import { useEffect, useRef, useState } from 'react'
import { loadCampaigns, previewCampaignMedia, saveCampaign } from './actions'
import { previewMessage, TOKENS } from '@/lib/whatsapp/campaign'
import { theme as T } from '@/app/components/theme'
import './whatsapp.css'

type Data = Awaited<ReturnType<typeof loadCampaigns>>
const initialTemplate = 'Courts available at {{club}} on {{date}}!\n{{availability}}\nBook here: {{booking_link}}'
export default function WhatsAppClient() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Data['campaigns'][number] | null>(null)
  const [club, setClub] = useState('')
  const [kind, setKind] = useState('availability')
  const [template, setTemplate] = useState(initialTemplate)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [version, setVersion] = useState(0)
  const [preview, setPreview] = useState('')
  useEffect(() => {
    let active = true
    loadCampaigns().then(result => { if (active) { setData(result); setError(''); setClub(c => c || result.clubs[0]?.id || '') } }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [version])
  function edit(campaign: Data['campaigns'][number] | null) {
    setEditing(campaign); setKind(campaign?.kind ?? 'availability'); setTemplate(campaign?.template ?? initialTemplate)
    setClub(campaign?.club_id ?? data?.clubs[0]?.id ?? ''); setPreview(''); setNotice('')
  }
  const schedule = editing?.schedule ?? {}
  return <div className="wa-page" style={{ color: T.colors.textPrimary }}>
    <header><h1>WhatsApp automation</h1><p>Court availability and event reminders.</p></header>
    <div className="wa-status"><span>Playtomic: not connected</span><span>WhatsApp group delivery: not connected</span></div>
    <p className="wa-muted">Set up your campaigns below. Schedules are saved as drafts; automatic sending becomes available after both connections are verified.</p>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!data ? <button onClick={() => setVersion(v => v + 1)}>Retry setup</button> : <div className="wa-layout">
      <section className="wa-card"><div className="wa-row"><h2>{editing ? 'Edit campaign' : 'New campaign'}</h2>{editing && <button onClick={() => edit(null)}>New</button>}</div>
        {!data.clubs.length ? <p>Ask Head Office to assign an active club.</p> : <form key={editing?.id ?? `new-${version}`} onSubmit={async e => {
          e.preventDefault(); if (lock.current) return
          const form = new FormData(e.currentTarget)
          lock.current = true; setBusy(true); setError(''); setNotice('')
          try { const result = await saveCampaign(form); if (result.error) setError(result.error); else { edit(null); setNotice('Draft saved. No messages will be sent until the integrations are connected.'); setVersion(v => v + 1) } }
          catch { setError('Could not confirm the save. Refresh before retrying.') }
          finally { lock.current = false; setBusy(false) }
        }}><fieldset disabled={busy}>
          <input type="hidden" name="id" value={editing?.id ?? ''} /><input type="hidden" name="updated_at" value={editing?.updated_at ?? ''} />
          <label>Campaign name<input name="title" maxLength={100} required defaultValue={editing?.title ?? ''} placeholder="Evening court availability" /></label>
          <label>Club<select name="club_id" value={club} onChange={e => setClub(e.target.value)} disabled={Boolean(editing)}>{data.clubs.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
          {editing && <input type="hidden" name="club_id" value={club} />}
          <label>Campaign type<select name="kind" value={kind} onChange={e => setKind(e.target.value)}><option value="availability">Available courts</option><option value="event">Event message</option></select></label>
          <label>WhatsApp group name<input name="destination_label" maxLength={120} required defaultValue={editing?.destination_label ?? ''} placeholder="Club players group" /></label>
          <small className="wa-muted">This is a destination label. A verified group destination must be linked during setup.</small>
          {kind === 'availability' ? <>
            <label>Send times (SAST, separated by commas)<input name="times" required defaultValue={schedule.times?.join(', ') ?? '08:00, 14:00'} placeholder="08:00, 14:00" /></label>
            <div className="wa-days">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day,i) => <label key={day}><input type="checkbox" name="weekdays" value={i} defaultChecked={(schedule.weekdays ?? [1,2,3,4,5]).includes(i)} />{day}</label>)}</div>
            <div className="wa-row"><label>Availability from<input name="window_start" type="time" defaultValue={schedule.window_start ?? '06:00'} required /></label><label>Until<input name="window_end" type="time" defaultValue={schedule.window_end ?? '23:00'} required /></label></div>
            <label>Minimum open slot<select name="minimum_minutes" defaultValue={schedule.minimum_minutes ?? 60}><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
            <small className="wa-muted">Planned behaviour: check availability before each send; skip if no matching slots or the source is stale.</small>
          </> : <>
            <label>Event<select name="event_id" required defaultValue={schedule.event_id ?? ''}><option value="">Select an event</option>{data.events.filter(event => event.club_id === club).map(event => <option key={event.id} value={event.id}>{event.name} · {event.event_date}</option>)}</select></label>
            <label>Send date and time (SAST)<input name="scheduled_at" type="datetime-local" required defaultValue={schedule.scheduled_at?.slice(0,16) ?? ''} /></label>
          </>}
          <label>Booking link<input name="booking_link" type="url" placeholder="https://…" defaultValue={schedule.booking_link ?? ''} /></label>
          <label>Message template<textarea name="template" rows={6} maxLength={2000} required value={template} onChange={e => setTemplate(e.target.value)} /></label>
          <small className="wa-muted">Available placeholders: {TOKENS.map(t => `{{${t}}}`).join(' ')}</small>
          <label>Image (PNG or JPEG, up to 5 MB)<input name="media" type="file" accept="image/png,image/jpeg" /></label>
          {editing?.media_path && <label className="wa-check"><input type="checkbox" name="remove_media" />Remove saved image</label>}
          <div className="wa-row"><button type="submit">{busy ? 'Saving…' : 'Save draft'}</button><button type="button" onClick={() => setPreview(previewMessage(template, { club: data.clubs.find(c => c.id === club)?.name ?? 'Demo Club', date: 'Sample date', availability: 'Example only: Court 1 · 18:00–19:30', event: 'Example club event', booking_link: 'https://example.com/book' }))}>Preview sample</button></div>
        </fieldset></form>}
        {preview && <div className="wa-preview"><small>Sample preview — not live availability</small><p style={{ whiteSpace: 'pre-wrap' }}>{preview}</p></div>}
      </section>
      <section className="wa-card"><h2>Saved campaigns</h2>{!data.campaigns.length && <p className="wa-muted">No campaigns yet.</p>}{data.campaigns.map(c => <article key={c.id} className="wa-campaign"><strong>{c.title}</strong><p>{data.clubs.find(club => club.id === c.club_id)?.name} · {c.destination_label}</p><p>{c.kind === 'availability' ? `${c.schedule.times?.join(', ')} SAST` : c.schedule.scheduled_at?.replace('T',' ').replace(':00+02:00',' SAST')} · Draft</p><div className="wa-row"><button disabled={busy} onClick={() => edit(c)}>Edit</button>{c.media_path && <button onClick={async () => { try { window.open(await previewCampaignMedia(c.id), '_blank', 'noopener,noreferrer') } catch { setError('Could not open the saved image.') } }}>View image</button>}</div></article>)}</section>
    </div>}
  </div>
}
