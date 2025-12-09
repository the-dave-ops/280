import React from 'react';

/**
 * Highlights matching text in a string
 * @param text - The full text to search in
 * @param query - The search query to highlight
 * @returns React elements with highlighted matches
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 text-slate-900 font-semibold px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights multiple possible matches in text
 * Useful for highlighting first name OR last name
 */
export function highlightMultiple(
  text: string,
  queries: string[]
): React.ReactNode {
  if (!queries.length || !text) {
    return text;
  }

  // Create regex pattern for all queries
  const pattern = queries
    .filter(q => q && q.trim())
    .map(q => escapeRegExp(q.trim()))
    .join('|');

  if (!pattern) {
    return text;
  }

  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  
  return parts.map((part, index) => {
    const isMatch = queries.some(
      q => q && part.toLowerCase() === q.toLowerCase()
    );
    
    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 text-slate-900 font-semibold px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
