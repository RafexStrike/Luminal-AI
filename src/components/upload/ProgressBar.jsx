// src/components/ProgressBar.jsx
'use client';

export default function ProgressBar({ percent = 0 }) {
  return (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div
        style={{ width: `${percent}%` }}
        className="h-full bg-blue-600 transition-all"
        aria-valuenow={percent}
      />
    </div>
  );
}
