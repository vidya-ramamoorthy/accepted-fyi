"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { filterColleges, type CollegeEntry } from "@/data/us-colleges";

const DEBOUNCE_DELAY_MS = 150;
const MAX_SUGGESTIONS = 8;

interface SchoolAutocompleteProps {
  value: string;
  onSelect: (schoolName: string, schoolState?: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
}

export default function SchoolAutocomplete({
  value,
  onSelect,
  id,
  className,
  required,
}: SchoolAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CollegeEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSuggestions = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const filtered = filterColleges(query, MAX_SUGGESTIONS);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    }, DEBOUNCE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCollege = (college: CollegeEntry) => {
    onSelect(college.name, college.state);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onSelect(newValue);
    updateSuggestions(newValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((previousIndex) =>
          Math.min(previousIndex + 1, suggestions.length - 1)
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((previousIndex) => Math.max(previousIndex - 1, 0));
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          event.preventDefault();
          handleSelectCollege(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder="Start typing a school name..."
        className={className}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={isOpen ? "school-suggestions" : undefined}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `school-option-${highlightedIndex}`
            : undefined
        }
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={dropdownRef}
          id="school-suggestions"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((college, index) => (
            <li
              key={`${college.name}-${college.state}`}
              id={`school-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                onClick={() => handleSelectCollege(college)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{college.name}</span>
                <span className="ml-2 text-gray-500">{college.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
