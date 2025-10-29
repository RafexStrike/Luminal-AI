'use client';
import { Plus } from 'lucide-react';

export default function UploadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-secondary gap-2"
    >
      <Plus size={16} />
      Upload Video
    </button>
  );
}
