'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@video-editor/editor-core';

// Dynamically import the PixiJS renderer to avoid SSR issues (window is undefined on server)
const PreviewRenderer = dynamic(
  () => import('@video-editor/preview-renderer').then(mod => mod.PreviewRenderer),
  { ssr: false, loading: () => <p className="text-sm text-stone-500 animate-pulse">Initializing PixiJS...</p> }
);

export const PreviewWrapper = () => {
   const { project, playheadMs } = useEditorStore();

   if (!project) {
      return (
         <div className="absolute inset-0 flex items-center justify-center bg-stone-900">
             <p className="text-sm text-stone-500">No Project</p>
         </div>
      );
   }

   return (
      <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden pointer-events-none">
          {/* pointer-events-none added initially until interactive canvas elements are needed */}
          <PreviewRenderer project={project} playheadMs={playheadMs} />
      </div>
   );
};
