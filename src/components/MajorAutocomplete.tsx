"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { COMMON_MAJORS } from "@/lib/constants/us-majors";

interface MajorAutocompleteProps {
  value: string;
  onSelect: (major: string) => void;
  onEnter?: () => void;
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export default function MajorAutocomplete({
  value,
  onSelect,
  onEnter,
  id,
  className,
  placeholder = "e.g., Computer Science",
  required,
  maxLength = 100,
}: MajorAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredMajors = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length === 0) return [];

    return COMMON_MAJORS.filter((major) =>
      major.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredMajors]);

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

  const handleSelectMajor = useCallback(
    (major: string) => {
      onSelect(major);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(event.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && filteredMajors[highlightedIndex]) {
        event.preventDefault();
        handleSelectMajor(filteredMajors[highlightedIndex]);
      } else {
        setIsOpen(false);
        onEnter?.();
      }
      return;
    }

    if (!isOpen || filteredMajors.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previousIndex) =>
        Math.min(previousIndex + 1, filteredMajors.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previousIndex) => Math.max(previousIndex - 1, 0));
    }
  };

  const handleFocus = () => {
    if (value.length > 0 && filteredMajors.length > 0) {
      setIsOpen(true);
    }
  };

  const showDropdown = isOpen && filteredMajors.length > 0;
  const listboxId = id ? `${id}-suggestions` : "major-suggestions";

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
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={showDropdown ? listboxId : undefined}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `${listboxId}-option-${highlightedIndex}`
            : undefined
        }
      />
      {showDropdown && (
        <ul
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-lg max-h-48 overflow-auto"
        >
          {filteredMajors.map((major, index) => (
            <li
              key={major}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                onClick={() => handleSelectMajor(major)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                {major}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
