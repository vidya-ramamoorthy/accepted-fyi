"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { US_STATES, type UsState } from "@/lib/constants/us-states";

interface StateAutocompleteProps {
  value: string;
  onSelect: (abbreviation: string) => void;
  onEnter?: () => void;
  id?: string;
  className?: string;
}

export default function StateAutocomplete({
  value,
  onSelect,
  onEnter,
  id,
  className,
}: StateAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredStates = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length === 0) return [];

    return US_STATES.filter((state: UsState) => {
      const nameMatch = state.name.toLowerCase().startsWith(query);
      const abbreviationMatch = state.abbreviation.toLowerCase().startsWith(query);
      return nameMatch || abbreviationMatch;
    });
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredStates]);

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

  const handleSelectState = useCallback(
    (state: UsState) => {
      onSelect(state.abbreviation);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.toUpperCase();
    onSelect(newValue);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && filteredStates[highlightedIndex]) {
        event.preventDefault();
        handleSelectState(filteredStates[highlightedIndex]);
      } else {
        setIsOpen(false);
        onEnter?.();
      }
      return;
    }

    if (!isOpen || filteredStates.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previousIndex) =>
        Math.min(previousIndex + 1, filteredStates.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previousIndex) => Math.max(previousIndex - 1, 0));
    }
  };

  const handleFocus = () => {
    if (value.length > 0 && filteredStates.length > 0) {
      setIsOpen(true);
    }
  };

  const showDropdown = isOpen && filteredStates.length > 0;

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
        maxLength={20}
        placeholder="e.g., California or CA"
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={showDropdown ? "state-suggestions" : undefined}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `state-option-${highlightedIndex}`
            : undefined
        }
      />
      {showDropdown && (
        <ul
          ref={dropdownRef}
          id="state-suggestions"
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-lg max-h-48 overflow-auto"
        >
          {filteredStates.map((state, index) => (
            <li
              key={state.abbreviation}
              id={`state-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                onClick={() => handleSelectState(state)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span className="font-medium">{state.name}</span>
                <span className="ml-2 text-slate-500">{state.abbreviation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
