import ClientEditor from '@/components/asset-editor/ClientEditor';
import { getPhotos } from '@/app/actions/photos';

export const metadata = {
  title: 'Asset Editor',
  description: 'Design your assets seamlessly',
};

export default async function AssetEditorPage() {
  const photos = await getPhotos();

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card">
        <h1 className="text-xl font-bold">Asset Editor</h1>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <ClientEditor photos={photos} />
      </main>
    </div>
  );
}
