import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { filterSelectOptionsByLabel, type SelectOption } from '../lib/clients';

type Props = {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  labelledBy?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  disabled = false,
  labelledBy,
  searchPlaceholder = 'Type to search',
  emptyMessage = 'No matches found',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0] ?? null,
    [options, value],
  );
  const filteredOptions = useMemo(
    () => filterSelectOptionsByLabel(options, searchQuery),
    [options, searchQuery],
  );

  useEffect(() => {
    if (!isOpen || filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }

    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filteredOptions, isOpen, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isOpen]);

  const open = () => {
    if (disabled) {
      return;
    }
    setSearchQuery('');
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
    triggerRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const menuId = `${id}-menu`;

  return (
    <div className={`searchable-select${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className="searchable-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-labelledby={labelledBy ? `${labelledBy} ${id}` : undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isOpen) {
              open();
            }
          }
        }}
      >
        <span className="searchable-select-value">{selectedOption?.label ?? ''}</span>
        <span className="searchable-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="searchable-select-menu" id={menuId} role="listbox">
          <div className="searchable-select-search-wrap">
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
            />
          </div>
          <ul className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <li className="searchable-select-empty">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li key={option.value || '__none__'}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`searchable-select-option${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''}`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
