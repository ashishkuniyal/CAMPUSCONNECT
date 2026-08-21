import React from 'react';

export default function LoadingSpinner({ size = 'md', fullScreen = false, message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} border-purple-500 border-t-transparent rounded-full animate-spin`}></div>
      {message && <p className="text-gray-300 animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Card skeleton loader
export function SkeletonCard() {
  return (
    <div className="glass p-6 rounded-xl border border-white/10 animate-pulse">
      <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
      <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-5/6"></div>
    </div>
  );
}

// List skeleton loader
export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass p-4 rounded-lg border border-white/10 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
