'use client';

import dynamic from 'next/dynamic';

const EditorLayout = dynamic(
  () => import('@/components/editor/EditorLayout').then((m) => m.EditorLayout),
  { ssr: false }
);

export function EditorClientWrapper() {
  return <EditorLayout />;
}
