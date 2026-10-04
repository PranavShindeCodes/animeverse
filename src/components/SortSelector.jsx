import React from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';

export const SortSelector = ({ sortBy, onSortChange }) => {
  return (
    <div className="sort-select-wrapper">
      <select
        className="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort anime by"
      >
        <option value="popular">Top Rated</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="az">Title (A - Z)</option>
        <option value="za">Title (Z - A)</option>
      </select>
      <ChevronDown size={16} className="sort-icon-right" />
    </div>
  );
};
