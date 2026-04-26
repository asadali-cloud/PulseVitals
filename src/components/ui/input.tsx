'use client';
import { useState } from 'react';

export default function VitalsInput({ data, setData }: { data: string, setData: (d: string) => void }) {
  return (
    <textarea 
      value={data} 
      onChange={(e) => setData(e.target.value)} 
      placeholder="Enter vitals data..."
    />
  );
}