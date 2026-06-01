import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { images } = body; // Array of { imageBase64, mimeType }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const prompt = `You are an expert at reading Mobile Legends: Bang Bang post-game scoreboard screenshots.
You have been provided with up to 3 screenshots from a single match.

INSTRUCTIONS:
1. Look at the screenshots carefully. The screen is split into two halves: Team 1 on the left (or top), and Team 2 on the right (or bottom).
2. Each half has exactly 5 rows (the 5 players).
3. For each player row, carefully read from left to right: their Hero picture/name, their IGN (In-Game Name), their Kills / Deaths / Assists (KDA), their total Gold, and their total Damage. 
4. Check for 'MVP' or 'MVP Loss' badges.
5. Extract the MVP score rating (e.g., 11.4, 6.0) located on the edge of their row.

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
      "kills": 0, "deaths": 0, "assists": 0, "gold": 0, "damage": 0, "damageTaken": 0, "mvpScore": 0.0, "isMvp": false
    }
  ],
  "team2_picks": [
    // same structure, 5 players
  ],
  "team1_bans": ["Hero1", "Hero2", "Hero3"],
  "team2_bans": ["Hero1", "Hero2", "Hero3"]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const parts: any[] = [{ text: prompt }];
    images.forEach((img: any) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: img.imageBase64
        }
      });
    });

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'Gemini API request failed: ' + errText }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
    }

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

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process screenshot' }, { status: 500 });
  }
}
