import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const prompt = `You are an expert at reading Mobile Legends: Bang Bang post-game scoreboard screenshots.

Analyze this screenshot and extract ALL game data you can see. Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

{
  "duration": "MM:SS format if visible",
  "winner": "team1 or team2 (left side team is team1, right side team is team2)",
  "team1_picks": [
    {
      "hero": "Hero Name (exact MLBB hero name)",
      "playerUsername": "Player IGN as shown",
      "role": "One of: Roamer, Gold Lane, Jungle, Exp Lane, Mid Lane (infer from hero if not shown)",
      "kills": 0,
      "deaths": 0,
      "assists": 0,
      "gold": 0,
      "damage": 0
    }
  ],
  "team2_picks": [
    {
      "hero": "Hero Name",
      "playerUsername": "Player IGN as shown",
      "role": "One of: Roamer, Gold Lane, Jungle, Exp Lane, Mid Lane",
      "kills": 0,
      "deaths": 0,
      "assists": 0,
      "gold": 0,
      "damage": 0
    }
  ],
  "team1_bans": ["Hero1", "Hero2", "Hero3"],
  "team2_bans": ["Hero1", "Hero2", "Hero3"]
}

Important rules:
- Extract exactly what you see. Do not guess or fabricate data.
- If you cannot read a value clearly, use 0 for numbers or "" for strings.
- Gold values should be the raw number (e.g. 12500, not "12.5K").
- Damage values should be the raw number.
- Hero names must match official MLBB names exactly (e.g. "Lancelot" not "lance", "Chang'e" not "Change").
- If bans are not visible, return empty arrays.
- team1 is always the LEFT/TOP team, team2 is the RIGHT/BOTTOM team.
- Return ONLY the JSON. No explanations, no markdown.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: imageBase64
              }
            }
          ]
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

    // Clean the response - strip markdown code fences if present
    let cleanJson = textContent.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process screenshot' }, { status: 500 });
  }
}
