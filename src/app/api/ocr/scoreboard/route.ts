import { NextResponse } from 'next/server';

// Models to try in order — if one is overloaded or unavailable, try the next
const MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
];

const MAX_RETRIES = 2; // retry each model up to 2 times
const RETRY_DELAY_MS = 2000; // wait 2s between retries

async function callGemini(model: string, parts: any[], apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[${model}] ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error(`[${model}] No text in response`);
  }
  return textContent;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const prompt = `You are an expert at reading Mobile Legends: Bang Bang post-game scoreboard screenshots.
You have been provided with up to 3 screenshots from a single match.

INSTRUCTIONS:
1. Look at the screenshots carefully. The screen is split into two halves: Team 1 on the left (or top), and Team 2 on the right (or bottom).
2. Each half has exactly 5 rows (the 5 players).
3. For each player row, carefully read: their Hero picture/name, their IGN (In-Game Name), their Kills / Deaths / Assists (KDA), and their total Gold earned.
4. Check for 'MVP' or 'MVP Loss' badges on each player.
5. Determine which team won (the team with the MVP badge player is the winning team).
6. Determine each player's role based on their hero and position: Roamer, Gold Lane, Jungle, Exp Lane, or Mid Lane.

Think step-by-step. First, write down your observations for Team 1 and Team 2.
Then, output a final JSON object wrapped in \`\`\`json ... \`\`\` codeblocks. There MUST be exactly 5 players in team1_picks and 5 players in team2_picks.

JSON Structure:
{
  "duration": "MM:SS format if visible",
  "winner": "team1 or team2",
  "team1_picks": [
    {
      "hero": "Exact MLBB Hero Name",
      "playerUsername": "Exact Player IGN",
      "role": "Roamer, Gold Lane, Jungle, Exp Lane, or Mid Lane",
      "kills": 0, "deaths": 0, "assists": 0, "gold": 0, "isMvp": false
    }
  ],
  "team2_picks": [
    // same structure, 5 players
  ],
  "team1_bans": ["Hero1", "Hero2", "Hero3"],
  "team2_bans": ["Hero1", "Hero2", "Hero3"]
}`;

    const parts: any[] = [{ text: prompt }];
    images.forEach((img: any) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: img.imageBase64
        }
      });
    });

    // Try each model with retries
    let lastError = '';
    for (const model of MODELS) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`OCR: Trying ${model} (attempt ${attempt}/${MAX_RETRIES})...`);
          const textContent = await callGemini(model, parts, GEMINI_API_KEY);

          // Extract JSON from markdown or raw text
          let cleanJson = "";
          const jsonMatch = textContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            cleanJson = jsonMatch[1].trim();
          } else {
            const start = textContent.indexOf('{');
            const end = textContent.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
              cleanJson = textContent.slice(start, end + 1);
            } else {
              cleanJson = textContent.trim();
            }
          }

          const parsed = JSON.parse(cleanJson);
          console.log(`OCR: Success with ${model} on attempt ${attempt}`);
          return NextResponse.json({ success: true, data: parsed });

        } catch (err: any) {
          lastError = err.message || 'Unknown error';
          console.error(`OCR: ${model} attempt ${attempt} failed:`, lastError);
          
          // If it's a 404 (model not found), skip to next model immediately
          if (lastError.includes('404') || lastError.includes('NOT_FOUND')) {
            break;
          }
          
          // Wait before retrying (for 503/rate limit errors)
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt);
          }
        }
      }
    }

    return NextResponse.json({ 
      error: 'All AI models are currently busy. Please try again in a few seconds. Last error: ' + lastError 
    }, { status: 503 });

  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process screenshot' }, { status: 500 });
  }
}
