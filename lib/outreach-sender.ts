import { corsair } from '@/lib/corsair';
import { cleanUnslopSubject } from '@/lib/unslop';

function encodeMimeHeader(value: string): string {
  const cleaned = cleanUnslopSubject(value);
  if (/[^\x00-\x7F]/.test(cleaned)) {
    return `=?UTF-8?B?${Buffer.from(cleaned, 'utf-8').toString('base64')}?=`;
  }
  return cleaned;
}

interface SendEmailParams {
  userId: string;
  to: string;
  subject: string;
  body: string;
  attachmentName?: string | null;
  attachmentData?: Uint8Array | Buffer | null;
}

export async function sendOutreachEmail({
  userId,
  to,
  subject,
  body,
  attachmentName,
  attachmentData,
}: SendEmailParams) {
  const tenantClient = corsair.withTenant(userId);
  const encodedSubject = encodeMimeHeader(subject);
  let rawMessage = '';

  if (!attachmentData || !attachmentName) {
    const emailLines = [
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(body, 'utf-8').toString('base64'),
    ];
    rawMessage = emailLines.join('\r\n');
  } else {
    const boundary = `corsair_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const emailHeaders = [
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ];

    const parts = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(body, 'utf-8').toString('base64'),
    ];

    const base64Pdf = Buffer.from(attachmentData).toString('base64');
    const safeFilename = attachmentName.replace(/["\r\n]/g, '');

    parts.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${safeFilename}"`,
      `Content-Disposition: attachment; filename="${safeFilename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      base64Pdf,
    );

    parts.push(`--${boundary}--`);

    rawMessage = emailHeaders.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
  }

  const base64Safe = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await tenantClient.gmail.api.messages.send({
    raw: base64Safe,
  });

  return result;
}
