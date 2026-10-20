import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public contact endpoint used by the website Contact page.
// Visitors are not signed in, so the enquiry is written to the support
// ticket queue with the service role. Input is validated and bounded here
// because anyone can reach this endpoint: only the four expected fields are
// read, each one trimmed and length-capped, and nothing else is forwarded.

const LIMITS = { name: 120, email: 200, subject: 160, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, limit) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body?.name, LIMITS.name);
    const email = clean(body?.email, LIMITS.email);
    const subject = clean(body?.subject, LIMITS.subject);
    const message = clean(body?.message, LIMITS.message);

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'Please fill in every field.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      ticket_number: `WEB-${Date.now().toString(36).toUpperCase()}`,
      subject: `Website enquiry — ${subject}`,
      category: 'technical',
      priority: 'medium',
      status: 'open',
      user_id: 'public-web-enquiry',
      user_name: name,
      description: `Submitted from the public Contact page.\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return Response.json({ ok: true, ticket_number: ticket.ticket_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}