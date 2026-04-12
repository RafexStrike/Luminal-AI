import React from 'react';
import { Loader2 } from 'lucide-react';
import theme from '@/design/theme.config';

export default function LoadingSpinner({ size = 'md', className = '', color = 'text-blue-600' }) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizeMap[size]} ${color} animate-spin`} 
        strokeWidth={2.5}
      />
    </div>
  );
}
