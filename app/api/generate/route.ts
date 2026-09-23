import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY || !process.env.ANTHROPIC_MODEL) return NextResponse.json({ error: 'AI generation is not configured.' }, { status: 503 })
  if (Number(req.headers.get('content-length')) > 20000) return NextResponse.json({ error: 'Request too large.' }, { status: 413 })
  let prompt: unknown
  try { ({ prompt } = await req.json()) } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 10000) return NextResponse.json({ error: 'Provide a prompt of 1–10,000 characters.' }, { status: 400 })
  // Database-backed quota works across serverless instances and restarts.
  const { data: allowed, error: quotaError } = await supabase.rpc('consume_ai_request')
  if (quotaError) return NextResponse.json({ error: 'AI rate-limit setup is pending.' }, { status: 503 })
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429, headers: { 'Retry-After': '60' } })
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL, max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) return NextResponse.json({ error: 'AI provider is unavailable. Please try again later.' }, { status: 502 })
    const data = await response.json()
    const result = data.content?.filter((block: { type: string }) => block.type === 'text').map((block: { text: string }) => block.text).join('\n')
    if (!result) return NextResponse.json({ error: 'AI provider returned no text.' }, { status: 502 })
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ error: 'AI generation failed or timed out.' }, { status: 502 })
  }
}
