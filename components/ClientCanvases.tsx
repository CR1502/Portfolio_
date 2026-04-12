'use client';

import dynamic from 'next/dynamic';

const BrainCanvas = dynamic(() => import('./BrainCanvas'), { ssr: false });
const TransformerCanvas = dynamic(() => import('./TransformerCanvas'), { ssr: false });
const AIAgent = dynamic(() => import('./AIAgent'), { ssr: false });

export default function ClientCanvases() {
  return (
    <>
      <TransformerCanvas />
      <BrainCanvas />
      <AIAgent />
    </>
  );
}
