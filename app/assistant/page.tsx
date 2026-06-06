'use client'

import { useState } from 'react'

const VA_RED = '#e00a09'

const templates = [
  { id: 'quote', label: 'Event Quote', description: 'Generate a professional quote for a client event' },
  { id: 'email', label: 'Customer Email Reply', description: 'Reply to a customer enquiry professionally' },
  { id: 'whatsapp', label: 'WhatsApp Alert', description: 'Send court availability or event reminder' },
]

export default function Assistant() {
  const [selected, setSelected] = useState('quote')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setOutput('')

    const prompts: { [key: string]: string } = {
      quote: `You are an assistant for Virgin Active Padel Club, a premium padel tennis club in South Africa. 
Generate a professional, branded event quote based on the following client request. 
Include sections for: Event Overview, Court Hire, Additional Services, Pricing Summary, and Terms.
Use South African Rand (R) for pricing. Keep it warm but professional.

Client request: ${input}`,

      email: `You are an assistant for Virgin Active Padel Club, a premium padel tennis club in South Africa.
Write a professional, friendly email reply to the following customer enquiry.
Sign off as "The Virgin Active Padel Team".

Customer enquiry: ${input}`,

      whatsapp: `You are an assistant for Virgin Active Padel Club, a premium padel tennis club in South Africa.
Write a short, friendly WhatsApp message for the club community group based on the following information.
Keep it concise, use 1-2 relevant emojis, and include a clear call to action.

Information: ${input}`,
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[selected] }),
      })
      const data = await response.json()
      setOutput(data.result)
    } catch (error) {
      setOutput('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f4f4f4', padding: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>AI Assistant</h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Generate quotes, email replies and WhatsApp alerts instantly</p>
        </div>

        {/* Template selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => { setSelected(t.id); setInput(''); setOutput('') }}
              style={{
                background: selected === t.id ? '#1a1a1a' : '#fff',
                border: selected === t.id ? `2px solid ${VA_RED}` : '2px solid #ececec',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <p style={{ fontSize: '15px', fontWeight: '600', color: selected === t.id ? '#fff' : '#1a1a1a', marginBottom: '6px' }}>{t.label}</p>
              <p style={{ fontSize: '13px', color: selected === t.id ? '#aaa' : '#888' }}>{t.description}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #ececec',
          marginBottom: '16px'
        }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selected === 'quote' && 'Describe the event request'}
            {selected === 'email' && 'Paste the customer enquiry'}
            {selected === 'whatsapp' && 'What do you want to communicate'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selected === 'quote' ? 'e.g. Corporate team building event for 20 people, need 3 courts for 2 hours, catering required...' :
              selected === 'email' ? 'Paste the customer email here...' :
              'e.g. Court 3 is available this Saturday 10am-12pm, R150 per person...'
            }
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '120px',
              resize: 'vertical',
              outline: 'none',
              color: '#1a1a1a',
            }}
          />
          <button
            onClick={generate}
            disabled={loading || !input.trim()}
            style={{
              marginTop: '16px',
              padding: '12px 28px',
              background: loading || !input.trim() ? '#ccc' : VA_RED,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Output */}
        {output && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1px solid #ececec`,
            borderTop: `3px solid ${VA_RED}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generated Output</label>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                style={{
                  padding: '6px 16px',
                  background: '#f4f4f4',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#1a1a1a',
                  fontFamily: 'inherit',
                }}
              >Copy</button>
            </div>
            <p style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{output}</p>
          </div>
        )}

      </div>
    </main>
  )
}