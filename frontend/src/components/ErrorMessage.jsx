import React from 'react';

export default function ErrorMessage({ 
  error, 
  title = 'Error', 
  onRetry, 
  fullScreen = false 
}) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.message || error?.error || 'An unexpected error occurred';

  const content = (
    <div className="glass p-8 rounded-xl border border-red-500/20 bg-red-500/5">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-red-300 mb-6">{errorMessage}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// Inline error message for forms
export function InlineError({ message }) {
  if (!message) return null;
  
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm mt-2 animate-shake">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// Network error component
export function NetworkError({ onRetry }) {
  return (
    <ErrorMessage
      error="Unable to connect to the server. Please check your internet connection."
      title="Network Error"
      onRetry={onRetry}
    />
  );
}
