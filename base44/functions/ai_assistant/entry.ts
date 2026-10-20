import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CUSTOMER_PROMPT = `You are "FIRELINK Assistant", the AI helper inside FIRELINK — an Indian fire safety equipment marketplace and compliance platform.
Help customers with: choosing the right fire safety products for their needs, fire safety regulations in India (NBC 2016, BIS/IS standards, Fire NOC basics), how ordering, RFQs and service requests work on the platform.
Rules:
- Reply in the same language style the user uses (Hindi, Hinglish or English).
- Be concise: under 150 words unless a regulation genuinely needs more.
- If catalog context is provided, recommend from it when relevant (name + price).
- Never invent product names or prices not in the context.
- For topics unrelated to fire safety, politely steer back.
- You are informational only; final decisions need a qualified professional.`;

const ENGINEER_PROMPT = `You are "FIRELINK Engineering Assistant", an expert fire protection engineering co-pilot inside FIRELINK.
Help engineers with: fire load calculations (NBC 2016 Part 4), hydrant and sprinkler system design (Hazen-Williams, IS 15105, IS 3844), extinguisher selection and placement (IS 2190), Fire NOC documentation, BOQ structuring, and code compliance questions.
Rules:
- Reply in the same language style the user uses (Hindi, Hinglish or English).
- Be technically precise; cite the relevant code/standard (NBC 2016, IS number) where applicable.
- Show short calculation steps when asked for sizing.
- Keep answers under 250 words unless the calculation requires more.
- ALWAYS end every engineering answer with this exact line: "⚠️ Engineering calculations and AI recommendations require review by a qualified professional."`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String((body && body.message) || '').slice(0, 2000).trim();
    const mode = body && body.mode === 'engineer' ? 'engineer' : 'customer';
    const history = Array.isArray(body && body.history) ? body.history.slice(-8) : [];
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    let context = '';
    if (mode === 'customer') {
      const products = await base44.entities.Product.filter({ approval_status: 'approved' }, '-created_date', 20);
      context = 'CATALOG CONTEXT (name | brand | category | price INR | stock):\n' +
        (products || []).map((p) => `- ${p.name} | ${p.brand || '—'} | ${p.category} | ₹${p.price} | ${p.stock ?? 0} units`).join('\n');
    }

    const convo = history
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${String(h.content || '').slice(0, 1000)}`)
      .join('\n');

    const system = mode === 'engineer' ? ENGINEER_PROMPT : CUSTOMER_PROMPT;
    const prompt = [
      system,
      context,
      convo ? 'CONVERSATION SO FAR:\n' + convo : '',
      'User: ' + message,
      'Assistant:',
    ].filter(Boolean).join('\n\n---\n\n');

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const reply = typeof llm === 'string' ? llm : String(llm && llm.response ? llm.response : llm);
    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}