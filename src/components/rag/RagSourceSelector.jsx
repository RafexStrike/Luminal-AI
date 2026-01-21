// FILE: src/components/rag/RagSourceSelector.jsx
// DESCRIPTION: Compact selector for choosing which sources to include in RAG
// PURPOSE: Allows user to select one or more RAG sources before sending message
//
// OPTIONAL UI: Only visible if user explicitly requests it
// No impact on default chat behavior

'use client';

import { useState } from 'react';
import { RAG_SOURCES } from './rag.constants';

export default function RagSourceSelector({
  selectedSources = [],
  onSourcesChange = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleSource = (sourceType) => {
    const newSources = selectedSources.includes(sourceType)
      ? selectedSources.filter((s) => s !== sourceType)
      : [...selectedSources, sourceType];

    onSourcesChange(newSources);
  };

  const handleSelectAll = () => {
    if (selectedSources.length === Object.keys(RAG_SOURCES).length) {
      onSourcesChange([]);
    } else {
      onSourcesChange(Object.keys(RAG_SOURCES));
    }
  };

  const sourcesList = Object.entries(RAG_SOURCES).map(([key, value]) => ({
    type: key,
    ...value,
  }));

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>
          {selectedSources.length === 0
            ? 'No context'
            : `${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <button
            onClick={handleSelectAll}
            className="w-full text-left px-2 py-1 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 pb-2 border-b border-gray-200"
          >
            {selectedSources.length === sourcesList.length
              ? 'Deselect All'
              : 'Select All'}
          </button>

          {sourcesList.map((source) => (
            <label
              key={source.type}
              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedSources.includes(source.type)}
                onChange={() => handleToggleSource(source.type)}
                className="rounded"
              />
              <span className="text-lg">{source.icon}</span>
              <span className="text-sm text-gray-700">{source.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
