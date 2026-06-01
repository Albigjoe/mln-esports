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
You have been provided with up to 3 screenshots from a single match (e.g., Bans/Picks, Stats Page 1, Stats Page 2).
Analyze these screenshots and extract ALL game data you can see across all of them. Merge the data together. 
Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

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
      "damage": 0,
      "damageTaken": 0,
      "mvpScore": 0.0,
      "isMvp": false
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
      "damage": 0,
      "damageTaken": 0,
      "mvpScore": 0.0,
      "isMvp": false
    }
  ],
  "team1_bans": ["Hero1", "Hero2", "Hero3"],
  "team2_bans": ["Hero1", "Hero2", "Hero3"]
}

Important rules:
- Extract exactly what you see. Do not guess or fabricate data.
- Merge the data from all provided screenshots. (e.g. kda from one, damage/damageTaken from another).
- For isMvp, set it to true if the player has an "MVP" or "MVP Loss" (or similar MVP-related) badge on their row.
- For mvpScore, extract the exact numerical rating (e.g., 11.4, 8.2, 3.0) displayed on the scoreboard for the player.
- If you cannot read a value clearly, use 0 for numbers or "" for strings.
- Gold values should be the raw number (e.g. 12500, not "12.5K").
- Damage and damageTaken values should be the raw number (e.g. 60500, not "60.5K").
- Hero names must match official MLBB names exactly (e.g. "Lancelot" not "lance", "Chang'e" not "Change").
- If bans are not visible in any screenshot, return empty arrays.
- team1 is always the LEFT/TOP team, team2 is the RIGHT/BOTTOM team.
- Return ONLY the JSON. No explanations, no markdown.`;

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
