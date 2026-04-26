import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let { url, strategy = 'MOBILE' } = await request.json();
  url = url.startsWith('http') ? url : `https://${url.trim()}`;

  const geminiKey = process.env.GEMINI_API_KEY;
  const pageSpeedKey = process.env.PAGESPEED_API_KEY;

  if (!geminiKey || !pageSpeedKey) {
    return NextResponse.json({ error: 'API keys missing' }, { status: 500 });
  }

  try {
    // 1. Call PageSpeed API
    const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${pageSpeedKey}&category=PERFORMANCE&strategy=${strategy}`;
    const psRes = await fetch(psUrl);
    if (!psRes.ok) {
      throw new Error(`PageSpeed API error: ${psRes.status}`);
    }
    const psData = await psRes.json();

    console.log('PageSpeed raw data:', psData); // Debug line

    const lighthouse = psData.lighthouseResult?.audits;
    const categories = psData.lighthouseResult?.categories;

    const lcp = lighthouse?.['largest-contentful-paint']?.displayValue || 'N/A';
    const cls = lighthouse?.['cumulative-layout-shift']?.displayValue || 'N/A';
    const fcp = lighthouse?.['first-contentful-paint']?.displayValue || 'N/A';
    const score = Math.round(categories?.performance?.score * 100) || 0;

    // 2. Send to Gemini for fixes
    const prompt = `
    You are a Senior Next.js Performance Engineer.
    Analyze this PageSpeed report for ${url} and give copy-paste Next.js 14 fixes.
    
    Current Metrics (${strategy}):
    - Performance Score: ${score}/100
    - LCP: ${lcp}
    - CLS: ${cls}
    - FCP: ${fcp}
    
    Return ONLY valid JSON with this structure:
    {
      "summary": "1 sentence on main bottleneck",
      "lcpAfter": "1.8s",
      "clsAfter": "0.05",
      "fixes": [
        {
          "issue": "Unoptimized Hero Image",
          "impact": "LCP 4.2s",
          "code": "<Image src=\\"hero.webp\\" width={1200} height={600} priority />",
          "steps": ["1. Convert to WebP", "2. Add width/height", "3. Use priority for above-fold"],
          "why": "Optimizing image format and adding priority reduces LCP time"
        }
      ],
      "timeSaved": "3.5 hours"
    }
    Give exactly 3 fixes. Code must be copy-paste ready for Next.js App Router.
    `;


    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) throw new Error('Gemini returned empty response');

    try {
      const aiFixes = JSON.parse(aiText);
      return NextResponse.json({
        current: { score, lcp, cls, fcp },
        ai: aiFixes
      });
    } catch (e) {
      console.error('Gemini JSON error:', e);
      return NextResponse.json({ 
        error: 'AI returned invalid JSON',
        raw: aiText 
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('Error:', e);
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 });
  }
}