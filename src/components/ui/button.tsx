'use client';

export default function AnalyzeButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}>Analyze Vitals</button>
  );
}