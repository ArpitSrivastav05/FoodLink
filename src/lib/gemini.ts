const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GenerateDescriptionInput {
  title: string;
  quantity: number;
  unit: string;
  hygieneNotes?: string;
  tags?: string[];
}

interface GeminiResponse {
  description: string;
  suggestedTags: string[];
}

// Simple in-memory rate-limit guard: at most 1 request per 5 seconds
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 5000;

function buildFallback(input: GenerateDescriptionInput): GeminiResponse {
  return {
    description: `Fresh ${input.title} — ${input.quantity} ${input.unit} available. ${
      input.hygieneNotes ? `Hygiene notes: ${input.hygieneNotes}. ` : ''
    }Order now to reduce food waste and enjoy quality surplus food at a reduced price!`,
    suggestedTags: generateFallbackTags(input.title),
  };
}

export async function generateFoodDescription(
  input: GenerateDescriptionInput
): Promise<GeminiResponse> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return buildFallback(input);
  }

  // Client-side throttle to avoid hitting 429
  const now = Date.now();
  if (now - lastRequestTime < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - (now - lastRequestTime)));
  }
  lastRequestTime = Date.now();

  try {
    const prompt = `You are a food listing description assistant for a food waste reduction platform called FoodLink. Generate a clear, compliant, and appealing food listing description.

Food item: ${input.title}
Quantity: ${input.quantity} ${input.unit}
${input.hygieneNotes ? `Hygiene notes: ${input.hygieneNotes}` : ''}
${input.tags?.length ? `Current tags: ${input.tags.join(', ')}` : ''}

Respond in JSON format:
{
  "description": "A 2-3 sentence appealing description that mentions freshness, quality, and encourages ordering to reduce waste.",
  "suggestedTags": ["array of 3-5 relevant tags like vegetarian, gluten-free, freshly-prepared, dairy-free, spicy, mild, etc."]
}

Only output the JSON, no markdown.`;

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
    });

    if (res.status === 429) {
      // Rate limited — wait 10s and retry once
      console.warn('Gemini rate limited (429). Retrying after 10s...');
      await new Promise((r) => setTimeout(r, 10000));

      const retry = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      });

      if (!retry.ok) {
        // Still failing — use fallback silently
        return buildFallback(input);
      }

      const retryData = await retry.json();
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const retryMatch = retryText.match(/\{[\s\S]*\}/);
      if (retryMatch) {
        const parsed = JSON.parse(retryMatch[0]);
        return {
          description: parsed.description || '',
          suggestedTags: parsed.suggestedTags || [],
        };
      }
      return buildFallback(input);
    }

    if (!res.ok) {
      console.warn(`Gemini API error ${res.status} — using fallback description.`);
      return buildFallback(input);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || '',
        suggestedTags: parsed.suggestedTags || [],
      };
    }

    return buildFallback(input);
  } catch (error) {
    console.warn('Gemini request failed, using fallback:', error);
    return buildFallback(input);
  }
}

function generateFallbackTags(title: string): string[] {
  const lower = title.toLowerCase();
  const tags: string[] = [];

  if (lower.includes('veg') || lower.includes('paneer') || lower.includes('dal') || lower.includes('sabzi'))
    tags.push('vegetarian');
  if (lower.includes('chicken') || lower.includes('mutton') || lower.includes('fish') || lower.includes('egg'))
    tags.push('non-vegetarian');
  if (lower.includes('biryani') || lower.includes('curry') || lower.includes('masala'))
    tags.push('spicy');
  if (lower.includes('sweet') || lower.includes('gulab') || lower.includes('kheer'))
    tags.push('dessert');
  if (lower.includes('rice') || lower.includes('roti') || lower.includes('naan'))
    tags.push('staple');
  if (lower.includes('salad') || lower.includes('soup'))
    tags.push('healthy');

  if (tags.length === 0) tags.push('freshly-prepared');
  tags.push('surplus-food');
  return tags.slice(0, 5);
}
