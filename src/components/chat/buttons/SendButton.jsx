'use client';
import { Send } from 'lucide-react';

export default function SendButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-primary btn-circle ${disabled ? 'btn-disabled' : ''}`}
    >
      <Send size={16} />
    </button>
  );
}
