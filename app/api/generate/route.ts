import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    })

    const data = await response.json()
    console.log('API response:', JSON.stringify(data))

    if (!response.ok) {
      return NextResponse.json({ result: `API Error: ${data.error?.message || 'Unknown error'}` })
    }

    const result = data.content[0].text
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Route error:', error)
    return NextResponse.json({ result: `Server error: ${error}` })
  }
}