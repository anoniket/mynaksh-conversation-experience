/**
 * MyNaksh chat proxy (dev only).
 *
 * Why this exists: the app must never ship an Anthropic key inside the bundle.
 * The phone talks to this process; this process talks to Claude. In production
 * this file is replaced by the real MyNaksh backend, and the app does not change
 * because it only knows the ConversationApi interface.
 *
 * Contract:  POST /chat  { clientId, text, replyToId?, history?: [{role, text}] }
 *            -> { text, recommendations: [{ id, type, title, subtitle? , ...extras }] }
 *
 * The model returns structured output validated by Zod. `type` is an open
 * string on purpose: the client registry decides how to render it, and an
 * unknown type falls back to a generic card. That is the forward-compat story.
 */
import { createServer } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.MODEL ?? 'claude-opus-5-5';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const RecommendationSchema = z.object({
  type: z
    .string()
    .describe(
      'Experience type. Prefer gemstone | tarot | consultation | article | promotion. ' +
        'You may invent a new type (e.g. remedy, panchang, meditation) when it genuinely fits.',
    ),
  title: z.string().max(60),
  subtitle: z.string().max(80).optional(),
  planet: z.string().optional(),
  spread: z.string().optional(),
  astrologerName: z.string().optional(),
  readMinutes: z.number().int().optional(),
  discountPct: z.number().int().optional(),
  code: z.string().optional(),
});

const ReplySchema = z.object({
  text: z.string().describe('The astrologer reply, 1-3 short sentences, warm and specific.'),
  recommendations: z
    .array(RecommendationSchema)
    .max(4)
    .describe('0 to 4 next-step experiences. Empty when nothing genuinely helps.'),
});

const SYSTEM = `You are MyNaksh's AI Vedic astrologer inside a chat app.
Reply briefly and kindly. Reference planets, transits or houses when relevant, never medical or legal advice.
After the reply, suggest zero to four "experiences" the user can tap next. Use the known types
(gemstone, tarot, consultation, article, promotion) when they fit; invent a new type only when it is clearly
better. Do not repeat the same type twice in one reply.`;

const HistoryItem = z.object({ role: z.enum(['user', 'assistant']), text: z.string() });
const RequestSchema = z.object({
  clientId: z.string(),
  text: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
  history: z.array(HistoryItem).max(20).optional(),
});

async function handleChat(body: unknown) {
  const req = RequestSchema.parse(body);
  const messages: Anthropic.MessageParam[] = [
    ...(req.history ?? []).map(h => ({ role: h.role, content: h.text }) as Anthropic.MessageParam),
    { role: 'user', content: req.text },
  ];

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages,
    output_config: { format: zodOutputFormat(ReplySchema), effort: 'low' },
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    return {
      text: 'I cannot help with that one, but I am happy to look at your chart for anything else.',
      recommendations: [],
    };
  }

  const parsed = response.parsed_output;
  return {
    text: parsed.text,
    recommendations: parsed.recommendations.map((r, i) => ({ id: `${req.clientId}_r${i}`, ...r })),
  };
}

function readJson(stream: NodeJS.ReadableStream): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    stream.on('data', c => (raw += c));
    stream.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    stream.on('error', reject);
  });
}

createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json');
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.end(JSON.stringify({ ok: true, model: MODEL }));
      return;
    }
    if (req.method === 'POST' && req.url === '/chat') {
      const out = await handleChat(await readJson(req));
      res.end(JSON.stringify(out));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (err) {
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : 400;
    res.statusCode = status;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown error' }));
    console.error('[proxy]', err);
  }
}).listen(PORT, () => console.log(`MyNaksh proxy on http://localhost:${PORT} (model ${MODEL})`));
