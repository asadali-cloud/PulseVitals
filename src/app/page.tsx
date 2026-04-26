'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');


  const analyze = async () => {
    if (!url) return setError('Enter a URL');
    setLoading(true);
    setError('');
    setData(null);

    try {
      const fixedUrl = url.startsWith('http') ? url : `https://${url.trim()}`;
      const strategy = device === 'mobile' ? 'MOBILE' : 'DESKTOP';
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fixedUrl, strategy }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDevice('mobile')}
          className={`px-4 py-2 rounded ${device === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Mobile
        </button>
        <button
          onClick={() => setDevice('desktop')}
          className={`px-4 py-2 rounded ${device === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Desktop
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-2">PulseVitals AI ({device})</h1>
      <p className="text-gray-600 mb-8">30-Second Core Web Vitals Fixer for Agencies</p>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a web page URL"
          className="border p-3 flex-1 rounded"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Get AI Fixes'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p>🔄 Running PageSpeed + Gemini AI...</p>}

      {data && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border p-6 rounded">
            <h2 className="text-xl font-bold mb-4 text-red-600">Before</h2>
            <div className="space-y-2">
              <p className="text-2xl font-bold">Score: {data.current.score}/100</p>
              <p>LCP: {data.current.lcp}</p>
              <p>CLS: {data.current.cls}</p>
              <p>FCP: {data.current.fcp}</p>
            </div>
          </div>

          <div className="border p-6 rounded border-green-500">
            <h2 className="text-xl font-bold mb-4 text-green-600">After AI Fixes</h2>
            <div className="space-y-2">
              <p>Expected LCP: {data.ai.lcpAfter}</p>
              <p>Expected CLS: {data.ai.clsAfter}</p>
              <p>Time Saved: {data.ai.timeSaved}</p>
            </div>
          </div>

          <div className="md:col-span-2 mt-6">
            <h3 className="text-2xl font-bold mb-4">AI-Generated Next.js Fixes</h3>
            <p className="mb-4 text-lg">{data.ai.summary}</p>
            {data.ai.fixes.map((fix: { issue: string; impact: string; code: string; steps: string[]; why: string }, i: number) => (
              
              <div key={i} className="mb-6 p-4 bg-gray-50 rounded">
             <h4 className="font-bold text-lg">{i + 1}. {fix.issue}</h4>
             <p className="text-sm text-red-600">Impact: {fix.impact}</p>
             <div className="relative">
               <pre className="bg-black text-green-400 p-3 rounded my-2 overflow-x-auto">
                 <code>{fix.code}</code>
               </pre>
               <button
                 onClick={() => copyCode(fix.code, i)}
                 className="absolute top-2 right-2 text-xs bg-gray-700 text-white px-2 py-1 rounded"
               >
                 {copied === i ? 'Copied!' : 'Copy'}
               </button>
             </div>
             <ol className="list-decimal ml-5">
               {fix.steps.map((s, j) => <li key={j}>{s}</li>)}
             </ol>
             <p className="text-sm text-blue-600 mt-2">Why this fix? {fix.why}</p>
           </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}