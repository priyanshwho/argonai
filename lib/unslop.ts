import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';

export const UNSLOP_PROMPT = `
You are an expert human editor. Edit the provided email to remove all AI tells ("unslop").
Preserve all key factual information, links, names, dates, amounts, and intent.
Make it sound like an email written by a thoughtful, clear human.

Patterns to detect and fix:
1. Content:
- Delete superficial -ing phrases ("highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...").
- Delete vague attributions ("industry reports suggest", "experts believe").

2. Language:
- Delete AI vocabulary. Never use: additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant, paramount. Use plain, direct words.
- Fancy ways to say "is": Avoid "serves as", "stands as", "boasts", "features". Just say "is" or "has".
- Avoid "Not just X, but Y." State the point directly.
- Avoid forcing ideas into groups of three.
- Avoid synonym cycling. Pick one natural term and stick to it.
- Avoid false ranges ("from X to Y" where X and Y aren't on a real scale).

3. Style:
- Em dash and en dash overuse: Avoid em dashes (—) and en dashes (–) entirely. Use periods, commas, or standard hyphens.
- Colon overuse: Avoid colons as mid-sentence connectors. Use colons only before a list.
- Avoid boldface overuse and inline-header lists.
- Avoid decorative emojis.
- Replace curly quotes with straight quotes (" and ').

4. Communication artifacts & pleasantries:
- Delete AI greeting/closing clichés: "I hope this email finds you well", "I hope this email finds you having a great week", "I hope this helps!", "Please let me know if you have any questions or need further assistance."
- Respond and state the message directly.

5. Filler:
- Cut filler phrases: "In order to" -> "To", "Due to the fact that" -> "Because". Delete "It is important to note that".
- Cut excessive hedging ("could potentially possibly be argued" -> "may").
- Cut generic conclusions ("The future looks bright"). State concrete facts or next steps.

6. Plain speech:
- Say what it does, not how it feels. Be concrete and specific.
- Shorten or split dense sentences. One idea per sentence.
- Prefer active voice and plain words ("utilize" -> "use", "facilitate" -> "help").
- Avoid mannered prose, abstract metaphors, and figurative clichés.

7. Output rules:
- Output ONLY the rewritten email body.
- No markdown code fences, headers, annotations, or subject line.
`;

export function cleanPunctuationAndFormatting(text: string): string {
  if (!text) return '';
  return text
    // Replace em dashes and en dashes with commas or hyphens
    .replace(/[\u2014\u2015]/g, ', ')
    .replace(/[\u2012\u2013]/g, '-')
    // Replace curly quotes with straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Remove common AI greeting clichés if present at start
    .replace(/^(hope this email finds you well[.,!]?\s*)/i, '')
    .replace(/^(i hope this email finds you well[.,!]?\s*)/i, '')
    // Normalize multiple spaces
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function cleanUnslopSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/[\u2014\u2015]/g, ' - ')
    .replace(/[\u2012\u2013]/g, ' - ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*-\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function unslopEmailText(options: {
  body: string;
  senderName?: string;
  recipientName?: string;
}): Promise<string> {
  const { body, senderName, recipientName } = options;
  if (!body || body.trim().length === 0) return body;

  try {
    const model = await getGoogleModel();
    let prompt = `Email to unslop:\n${body}`;
    if (senderName) {
      prompt += `\n\nNote: The sender's name is "${senderName}". Ensure it ends with their name naturally.`;
    }
    if (recipientName) {
      prompt += `\nNote: The recipient's name is "${recipientName}".`;
    }

    const res = await generateText({
      model,
      system: UNSLOP_PROMPT,
      prompt,
    });

    const rewritten = res.text.trim();
    if (rewritten) {
      return cleanPunctuationAndFormatting(rewritten);
    }
  } catch (err) {
    console.error('Failed to run unslop LLM pass:', err);
  }

  return cleanPunctuationAndFormatting(body);
}
