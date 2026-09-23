'use client'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'

type Result = { error?: string }
export function ActionForm({ action, children, style, confirmation, successMessage }: {
  action: (form: FormData) => Promise<Result>
  children: ReactNode
  style?: CSSProperties
  confirmation?: string
  successMessage: string
}) {
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  return <form style={style} onSubmit={async event => {
    event.preventDefault()
    if (busy.current || (confirmation && !window.confirm(confirmation))) return
    const form = new FormData(event.currentTarget)
    busy.current = true
    setPending(true)
    setMessage('')
    try {
      const result = await action(form)
      setFailed(Boolean(result.error))
      setMessage(result.error || successMessage)
    } catch {
      setFailed(true)
      setMessage('Could not confirm the result. Refresh the user list before retrying.')
    } finally { busy.current = false; setPending(false) }
  }}>
    <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>{children}</fieldset>
    <p role={failed ? 'alert' : 'status'} aria-live="polite" style={{ fontSize: 13, color: failed ? '#ff9999' : '#a9dcb5', marginBottom: 0 }}>
      {pending ? 'Saving — please wait…' : message}
    </p>
  </form>
}
