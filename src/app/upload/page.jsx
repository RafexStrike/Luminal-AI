// src/app/upload/page.jsx
'use client';

import UploadForm from "@/components/upload/UploadForm";

export default function UploadPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <p className="mb-4 text-sm text-gray-500">Upload a short video and get transcription + summary.</p>
      <UploadForm />
    </main>
  );
}
