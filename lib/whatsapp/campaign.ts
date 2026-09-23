export const TOKENS = ['club', 'date', 'availability', 'event', 'booking_link'] as const
export function validateCampaign(input: { title: string; template: string; kind: string; times: string[]; weekdays: number[]; scheduledAt: string | null; windowStart: string; windowEnd: string }) {
  if (!input.title.trim() || input.title.length > 100) throw new Error('Enter a campaign name of up to 100 characters.')
  if (!input.template.trim() || input.template.length > 2000) throw new Error('Enter a message of up to 2,000 characters.')
  for (const match of input.template.matchAll(/\{\{(.*?)\}\}/g)) {
    if (!(TOKENS as readonly string[]).includes(match[1])) throw new Error(`Unknown placeholder: ${match[1]}`)
  }
  if (!['availability', 'event'].includes(input.kind)) throw new Error('Choose a campaign type.')
  if (input.kind === 'availability') {
    if (!input.times.length || input.times.length > 6 || input.times.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new Error('Choose one to six valid send times.')
    if (!input.weekdays.length || input.weekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Choose at least one weekday.')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.windowStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.windowEnd) || input.windowStart >= input.windowEnd) throw new Error('Court availability end time must be after its start time.')
  } else if (!input.scheduledAt || !Number.isFinite(Date.parse(input.scheduledAt)) || Date.parse(input.scheduledAt) <= Date.now()) throw new Error('Choose a future send date and time.')
}
export function previewMessage(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(.*?)\}\}/g, (token, key) => values[key] ?? token)
}
