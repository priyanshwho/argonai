import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';

interface Attachment {
  filename: string;
  content: string; // Base64 data URI or plain base64 string
}

import { cleanUnslopSubject } from '@/lib/unslop';

function encodeMimeHeader(value: string): string {
  // Sanitize any carriage returns or newlines to prevent header injection
  const cleaned = cleanUnslopSubject(value);
  // If string contains non-ASCII characters (code point > 127), encode via RFC 2047 base64
  if (/[^\x00-\x7F]/.test(cleaned)) {
    return `=?UTF-8?B?${Buffer.from(cleaned, 'utf-8').toString('base64')}?=`;
  }
  return cleaned;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { to, subject, body, attachments = [], threadId } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Please enter a valid recipient email address' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address for the recipient' }, { status: 400 });
    }

    const tenantClient = corsair.withTenant(session.user.id);
    const encodedSubject = encodeMimeHeader(subject);
    let rawMessage = '';

    if (attachments.length === 0) {
      // Simple raw email format with RFC 2047 header and base64 body encoding
      const emailLines = [
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${encodedSubject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(body, 'utf-8').toString('base64')
      ];
      rawMessage = emailLines.join('\r\n');
    } else {
      // Multipart email format for attachments
      const boundary = `corsair_boundary_${Date.now()}`;
      const emailHeaders = [
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${encodedSubject}`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`
      ];

      const parts = [
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(body, 'utf-8').toString('base64')
      ];

      for (const att of attachments as Attachment[]) {
        let base64Data = att.content;
        // Strip data URI prefix if present (e.g. data:image/png;base64,...)
        if (base64Data.includes(';base64,')) {
          base64Data = base64Data.split(';base64,')[1];
        }

        const safeFilename = att.filename.replace(/["\r\n]/g, '');

        parts.push(
          `--${boundary}`,
          `Content-Type: application/octet-stream; name="${safeFilename}"`,
          `Content-Disposition: attachment; filename="${safeFilename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          base64Data
        );
      }

      parts.push(`--${boundary}--`);

      rawMessage = emailHeaders.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
    }

    // Convert raw message to URL-safe base64 representation
    const base64Safe = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await tenantClient.gmail.api.messages.send({
      raw: base64Safe,
      threadId: threadId || undefined,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Failed to send email via route:', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
