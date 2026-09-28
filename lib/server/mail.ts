import { db } from "./db";
export async function queueMail(
  recipient: string,
  subject: string,
  body: string,
) {
  await db.outbox.create({ data: { recipient, subject, body } });
}
export async function sendOutbox() {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM)
    return { sent: 0, configured: false };
  const rows = await db.outbox.findMany({
    where: {
      sentAt: null,
      attempts: { lt: 8 },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
    },
    take: 20,
  });
  let sent = 0;
  for (const row of rows) {
    const claim = await db.outbox.updateMany({
      where: {
        id: row.id,
        sentAt: null,
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
      },
      data: {
        lockedUntil: new Date(Date.now() + 120000),
        attempts: { increment: 1 },
      },
    });
    if (!claim.count) continue;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": row.id,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: row.recipient,
          subject: row.subject,
          text: row.body,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw Error("Email unavailable");
      await db.outbox.update({
        where: { id: row.id },
        data: { sentAt: new Date() },
      });
      sent++;
    } catch {}
  }
  return { sent, configured: true };
}
