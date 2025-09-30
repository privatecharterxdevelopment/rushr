// app/api/ai/scope/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      text = '',
      category = '',
      area = '',
      timing = '',
      tone = 'Friendly',
      extras = {},
    } = body || {}

    const out = rewrite({ text, category, area, timing, tone, extras })
    return Response.json({ text: out })
  } catch {
    return new Response('Bad request', { status: 400 })
  }
}

function rewrite(ctx: {
  text: string
  category?: string
  area?: string
  timing?: string
  tone?: 'Neutral'|'Friendly'|'Technical'
  extras?: { propertyType?: string; accessNotes?: string; hasPets?: string; preferredContact?: string }
}) {
  const base = tidy(ctx.text)
  const cat = ctx.category ? ctx.category.toLowerCase() : ''
  const area = ctx.area ? ctx.area.toLowerCase() : ''
  const timing = ctx.timing || ''

  const where = area ? ` in the ${area}` : ''
  const about = cat ? ` ${cat} issue` : ' issue'

  let lead: string
  switch (ctx.tone) {
    case 'Technical':
      lead = `${capitalize(base)}${base.endsWith('.') ? '' : '.'}`
      break
    case 'Neutral':
      lead = `${capitalize(base || `Looking for help${where}${cat ? ` with a ${cat} issue` : ''}.`).trim()}`
      break
    default: // Friendly
      lead = base
        ? `Looking for help${where}${cat ? ` with a ${cat} issue` : ''}. ${capitalize(base)}${base.endsWith('.') ? '' : '.'}`
        : `Looking for help${where} with a${about}.`
  }

  const when = timing
    ? timing === 'ASAP' ? 'Hoping to get someone out as soon as possible.'
    : timing === 'This week' ? 'Ideally this week.'
    : 'Timing is flexible.'
    : ''

  const extraBits: string[] = []
  if (ctx.extras?.accessNotes) extraBits.push(`Access: ${ctx.extras.accessNotes}`)
  if (ctx.extras?.propertyType) extraBits.push(`Property: ${ctx.extras.propertyType}`)
  if (ctx.extras?.hasPets)      extraBits.push(`Pets: ${ctx.extras.hasPets}`)
  if (ctx.extras?.preferredContact) extraBits.push(`Contact: ${ctx.extras.preferredContact}`)

  const tail = [when, extraBits.join(' • ')].filter(Boolean).join(' ')
  return [lead, tail].filter(Boolean).join(' ')
}

/* --- helpers --- */
function tidy(s: string) {
  const t = (s || '').trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(ac|hvac)\b/gi, (m) => m.toUpperCase())
    .replace(/\b(eletrical|eletricity)\b/gi, 'electrical')
  return t
}
function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
