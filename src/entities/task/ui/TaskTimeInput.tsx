import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { normalizeTaskTime } from '../lib/normalizeTaskTime';

import styles from './TaskTimeInput.module.scss';

const HALF_HOUR_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, '0');
  const minute = index % 2 === 0 ? '00' : '30';
  return `${hour}:${minute}`;
});

interface TaskTimeInputProps {
  disabled: boolean;
  errorMessage: string;
  label: string;
  noTimeLabel: string;
  value: string;
  onChange: (value: string) => void;
}

export function TaskTimeInput({
  disabled,
  errorMessage,
  label,
  noTimeLabel,
  value,
  onChange,
}: TaskTimeInputProps) {
  const inputId = useId();
  const listId = useId();
  const errorId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suppressFocusOpen = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const options = ['', ...HALF_HOUR_OPTIONS];
  const isInvalid = value !== '' && normalizeTaskTime(value) === null;

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen]);

  const openOptions = () => {
    if (disabled || suppressFocusOpen.current) return;
    setActiveIndex(options.indexOf(normalizeTaskTime(value) ?? value));
    setIsOpen(true);
  };

  const chooseOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
    suppressFocusOpen.current = true;
    inputRef.current?.focus();
    queueMicrotask(() => { suppressFocusOpen.current = false; });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        if (current < 0) return event.key === 'ArrowDown' ? 0 : options.length - 1;
        return Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
      });
    } else if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault();
      chooseOption(options[activeIndex] ?? '');
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          className={styles.input}
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="HH:mm"
          maxLength={5}
          value={value}
          disabled={disabled}
          role="combobox"
          aria-autocomplete="none"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? errorId : undefined}
          onFocus={openOptions}
          onClick={openOptions}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {isOpen
          ? (
              <div className={styles.options} id={listId} role="listbox" aria-label={label}>
                {options.map((option, index) => (
                  <div
                    ref={(node) => { optionRefs.current[index] = node; }}
                    className={styles.option}
                    data-active={activeIndex === index}
                    id={`${listId}-${index}`}
                    key={option || 'none'}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseOption(option)}
                  >
                    {option || noTimeLabel}
                  </div>
                ))}
              </div>
            )
          : null}
      </div>
      {isInvalid
        ? <span className={styles.error} id={errorId} role="alert">{errorMessage}</span>
        : null}
    </div>
  );
}
