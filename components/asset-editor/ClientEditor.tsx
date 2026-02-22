'use client';

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('./Editor'), {
    ssr: false,
    loading: () => (
        <div className="flex w-full h-full items-center justify-center">
            Loading Editor...
        </div>
    ),
});

export default function ClientEditor() {
    return <Editor />;
}
