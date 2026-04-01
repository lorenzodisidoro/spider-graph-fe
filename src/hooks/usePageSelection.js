import { useState } from 'react';
import { MAX_PAGES_TO_EXPORT } from '../constants.js';

export function usePageSelection(totalPages) {
  const [selectedPageIndices, setSelectedPageIndices] = useState(new Set());

  const togglePageSelection = (pageIndex) => {
    setSelectedPageIndices((current) => {
      const updated = new Set(current);
      
      if (updated.has(pageIndex)) {
        // Deselect if already selected
        updated.delete(pageIndex);
      } else if (updated.size < MAX_PAGES_TO_EXPORT) {
        // Select if under the limit
        updated.add(pageIndex);
      }
      
      return updated;
    });
  };

  const selectAllPages = () => {
    const allIndices = new Set();
    const maxIndex = Math.min(totalPages, MAX_PAGES_TO_EXPORT);
    
    for (let i = 0; i < maxIndex; i++) {
      allIndices.add(i);
    }
    
    setSelectedPageIndices(allIndices);
  };

  const clearSelection = () => {
    setSelectedPageIndices(new Set());
  };

  const isPageSelected = (pageIndex) => {
    return selectedPageIndices.has(pageIndex);
  };

  const getSelectedCount = () => {
    return selectedPageIndices.size;
  };

  const hasReachedLimit = () => {
    return selectedPageIndices.size >= MAX_PAGES_TO_EXPORT;
  };

  return {
    selectedPageIndices,
    togglePageSelection,
    selectAllPages,
    clearSelection,
    isPageSelected,
    getSelectedCount,
    hasReachedLimit,
  };
}
