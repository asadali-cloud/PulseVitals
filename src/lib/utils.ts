export const analyzeVitals = async (vitalsData: string) => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vitalsData }),
  });
  return res.json();
};