"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const DEBOUNCE_DELAY_MS = 150;

interface SchoolResult {
  id: string;
  name: string;
  state: string;
  city: string;
}

interface SchoolAutocompleteProps {
  value: string;
  onSelect: (schoolName: string, schoolState?: string, schoolCity?: string) => void;
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
  const [suggestions, setSuggestions] = useState<SchoolResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateSuggestions = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `/api/schools/autocomplete?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        const schoolResults: SchoolResult[] = data.schools ?? [];
        setSuggestions(schoolResults);
        setIsOpen(schoolResults.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Autocomplete fetch failed:", error);
      }
    }, DEBOUNCE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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

  const handleSelectSchool = (school: SchoolResult) => {
    onSelect(school.name, school.state, school.city);
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
          handleSelectSchool(suggestions[highlightedIndex]);
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
          className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-lg max-h-48 overflow-auto sm:max-h-60"
        >
          {suggestions.map((school, index) => (
            <li
              key={`${school.name}-${school.state}`}
              id={`school-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                onClick={() => handleSelectSchool(school)}
                className={`w-full px-3 py-2.5 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span className="font-medium">{school.name}</span>
                <span className="ml-2 text-slate-500">{school.city}, {school.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
