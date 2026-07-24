import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, Plus, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  onCreateNew?: () => void;
  createNewText?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  isLoading = false,
  onCreateNew,
  createNewText = "Create new",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setFocusedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        onChange(filteredOptions[focusedIndex].value);
        setOpen(false);
        setSearch("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={open ? handleKeyDown : undefined}>
      <div
        className={cn(
          "flex items-center justify-between w-full rounded-md border border-[#E8DCC9] bg-[#FFFDF8] px-3 py-2 text-sm ring-offset-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
        onClick={() => !disabled && setOpen(!open)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            !disabled && setOpen(true);
          }
        }}
      >
        <span className={cn("truncate", !selectedOption && "text-[#5F5A54]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {selectedOption && !disabled && (
            <div 
              role="button"
              className="text-[#8B857D] hover:text-[#5F5A54] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="h-4 w-4" />
            </div>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full z-50 bg-[#FFFDF8] rounded-md border border-[#E8DCC9] shadow-md max-h-60 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-[#E8DCC9] px-3 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[#5F5A54] disabled:cursor-not-allowed disabled:opacity-50 text-[#3A2418]"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-[#5F5A54] flex flex-col items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#5F5A54]">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt, i) => (
                <div
                  key={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-[#E8DCC9] hover:text-[#3A2418] transition-colors text-[#3A2418]",
                    value === opt.value && "bg-[#E8DCC9] font-medium",
                    focusedIndex === i && "bg-[#E8DCC9] text-[#3A2418]"
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  onMouseEnter={() => setFocusedIndex(i)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </div>
              ))
            )}
          </div>
          {onCreateNew && (
            <div 
              className="p-1 border-t border-[#E8DCC9] bg-[#FAF5EC] shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onCreateNew();
              }}
            >
              <div className={cn(
                "flex items-center gap-2 px-2 py-2 text-sm text-primary hover:bg-primary/5 cursor-pointer rounded-sm transition-colors font-medium",
                focusedIndex === filteredOptions.length && "bg-primary/5"
              )}>
                <Plus className="h-4 w-4" />
                {createNewText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
