"use client";

import { lastDayOfMonth, parse } from "date-fns";
import * as React from "react";
import {
  clampDayForYearMonth,
  ComposedDate,
  formatDateValue,
  isValidDate,
  keyFrom,
} from "../helpers/date-picker-helpers.js";

type Segment = "year" | "month" | "day";

export interface SegmentedDateInputRef {
  focusSegment: (segment: Segment) => void;
}

const SEG_MAX: Record<Segment, number> = { year: 4, month: 2, day: 2 } as const;
const SEGMENT_CONFIG = {
  year: { placeholder: "YYYY", ariaLabel: "Year" },
  month: { placeholder: "MM", ariaLabel: "Month" },
  day: { placeholder: "DD", ariaLabel: "Day" },
} as const;

type DateSegmentsContextValue = {
  values: Record<Segment, string>;
  refs: Record<Segment, React.MutableRefObject<HTMLInputElement | null>>;
  disabled: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, segment: Segment) => void;
  handleSegmentInput: (
    e: React.ChangeEvent<HTMLInputElement>,
    segment: Segment,
    maxLength: number,
  ) => void;
  padOnBlur: (seg: "month" | "day") => () => void;
};

const DateSegmentsContext = React.createContext<DateSegmentsContextValue | null>(null);

const useDateSegments = () => {
  const ctx = React.useContext(DateSegmentsContext);
  if (!ctx) {
    throw new Error("DateSegmentInput must be used within DateSegmentsContext.Provider");
  }

  return ctx;
};

interface DateSegmentInputProps {
  segmentType: Segment;
  className?: string;
  disabled?: boolean;
}

const DateSegmentInput: React.FC<DateSegmentInputProps> = ({
  segmentType,
  className,
  disabled,
}) => {
  const {
    values,
    refs,
    disabled: ctxDisabled,
    handleKeyDown,
    handleSegmentInput,
    padOnBlur,
  } = useDateSegments();

  const value = values[segmentType];
  const inputRef = refs[segmentType];
  const max = SEG_MAX[segmentType];
  const config = SEGMENT_CONFIG[segmentType];

  return (
    <input
      ref={inputRef}
      aria-label={config.ariaLabel}
      autoComplete="off"
      className={`SegmentedDateInput-input SegmentedDateInput-input--${segmentType} ${!value ? "is-empty" : ""} ${className ?? ""}`}
      disabled={disabled ?? ctxDisabled}
      inputMode="numeric"
      maxLength={max}
      pattern="[0-9]*"
      placeholder={config.placeholder}
      type="text"
      value={value}
      onChange={(e) => handleSegmentInput(e, segmentType, max)}
      onKeyDown={(e) => handleKeyDown(e, segmentType)}
      onBlur={segmentType === "month" || segmentType === "day" ? padOnBlur(segmentType) : undefined}
    />
  );
};

interface SegmentedDateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  onPartialDateChange?: (partialDate: ComposedDate) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  open?: boolean;
  onEnterWhenValid?: () => void;
}

const SegmentedDateInput = React.forwardRef<SegmentedDateInputRef, SegmentedDateInputProps>(
  (
    {
      value,
      onChange,
      onPartialDateChange,
      onEnterWhenValid,
      disabled = false,
      minDate,
      maxDate,
      open,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(() => formatDateValue(value));
    const lastEmittedKey = React.useRef<string | null>(null);
    const prevOpenRef = React.useRef(false);
    const yearRef = React.useRef<HTMLInputElement>(null);
    const monthRef = React.useRef<HTMLInputElement>(null);
    const dayRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focusSegment: (segment: Segment) => {
          const refMap = { year: yearRef, month: monthRef, day: dayRef };
          refMap[segment].current?.focus();
        },
      }),
      [],
    );

    const isDateInRange = React.useCallback(
      (date: Date) => (!minDate || date >= minDate) && (!maxDate || date <= maxDate),
      [minDate, maxDate],
    );

    const _parse = React.useCallback((key: string) => parse(key, "yyyy-MM-dd", new Date()), []);

    React.useEffect(() => {
      const next = formatDateValue(value);
      setInternalValue(next);
      lastEmittedKey.current = value ? keyFrom(next) : null;
    }, [value]);

    React.useEffect(() => {
      onPartialDateChange?.(internalValue);
    }, [internalValue, onPartialDateChange]);

    React.useEffect(() => {
      const wasOpen = prevOpenRef.current;

      const resetToProp = () => {
        const next = formatDateValue(value);
        const nextKey = value ? keyFrom(next) : null;
        lastEmittedKey.current = nextKey;
        return next;
      };

      if (wasOpen && open === false) {
        setInternalValue((v) => {
          const isCompleteValid = isValidDate(v);

          if (!isCompleteValid) {
            return resetToProp();
          }

          const key = keyFrom(v);
          const date = _parse(key);

          if (!isDateInRange(date)) {
            return resetToProp();
          }

          return v; // Valid and in range
        });
      }

      prevOpenRef.current = !!open;
    }, [open, isDateInRange, value, _parse]);

    const commitIfCompleteAndValid = React.useCallback(
      (candidate: ComposedDate) => {
        const complete =
          candidate.year.length === SEG_MAX.year &&
          candidate.month.length === SEG_MAX.month &&
          candidate.day.length === SEG_MAX.day;

        if (complete && isValidDate(candidate)) {
          const key = keyFrom(candidate);
          const date = _parse(key);

          if (lastEmittedKey.current !== key) {
            lastEmittedKey.current = key;
            onChange?.(date);
          }

          return;
        }

        if (!candidate.year && !candidate.month && !candidate.day) {
          if (lastEmittedKey.current !== null) {
            lastEmittedKey.current = null;
          }

          onChange?.(undefined);
        }
      },
      [onChange, _parse],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent, current: Segment) => {
        const input = e.currentTarget;

        if (!(input instanceof HTMLInputElement)) {
          return;
        }

        const cursor = input.selectionStart ?? 0;
        const len = input.value.length;

        switch (e.key) {
          case "ArrowRight":
            if (cursor === len) {
              e.preventDefault();
              if (current === "year") {
                monthRef.current?.focus();
                monthRef.current?.setSelectionRange(0, 0);
              } else if (current === "month") {
                dayRef.current?.focus();
                dayRef.current?.setSelectionRange(0, 0);
              }
            }

            break;

          case "ArrowLeft":
            if (cursor === 0) {
              e.preventDefault();
              if (current === "day") {
                monthRef.current?.focus();
                const monthInput = monthRef.current;

                if (!monthInput) {
                  return;
                }

                monthInput.setSelectionRange(monthInput.value.length, monthInput.value.length);
              } else if (current === "month") {
                yearRef.current?.focus();
                const yearInput = yearRef.current;

                if (!yearInput) {
                  return;
                }

                yearInput.setSelectionRange(yearInput.value.length, yearInput.value.length);
              }
            }

            break;

          case "Backspace":
            if ((input.selectionStart ?? 0) === 0 && (input.selectionEnd ?? 0) === 0) {
              if (current === "day") {
                if (!monthRef.current) {
                  return;
                }

                monthRef.current?.focus();
                const monthInput = monthRef.current;
                monthInput.setSelectionRange(0, monthInput.value.length);
              } else if (current === "month") {
                yearRef.current?.focus();
                const yearInput = yearRef.current;
                if (!yearInput) {
                  return;
                }

                yearInput.setSelectionRange(0, yearInput.value.length);
              }
            }

            break;

          case "Escape":
            input.blur();
            break;

          case "Enter":
            if (isValidDate(internalValue) && isDateInRange(_parse(keyFrom(internalValue)))) {
              onEnterWhenValid?.();
            }

            break;
        }
      },
      [internalValue, onEnterWhenValid, isDateInRange, _parse],
    );

    const padOnBlur = React.useCallback(
      (segmentType: "month" | "day") => () => {
        setInternalValue((currentValues) => {
          if (currentValues[segmentType] && currentValues[segmentType].length === 1) {
            const paddedValue = `0${currentValues[segmentType]}`;
            const nextValues = {
              ...currentValues,
              [segmentType]: paddedValue,
            };

            nextValues.day = clampDayForYearMonth({
              year: nextValues.year,
              month: nextValues.month,
              day: nextValues.day,
            });

            commitIfCompleteAndValid(nextValues);
            return nextValues;
          }

          commitIfCompleteAndValid(currentValues);
          return currentValues;
        });
      },
      [commitIfCompleteAndValid],
    );

    const handleSegmentInput = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>, segment: Segment, maxLength: number) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, maxLength);
        let segmentValue = digits;

        if (segment === "month") {
          const monthNum = parseInt(segmentValue, 10);
          if (segmentValue.length === 1 && monthNum >= 2 && monthNum <= 9) {
            segmentValue = `0${monthNum}`;
          } else if (segmentValue.length === 2) {
            if (monthNum === 0) {
              segmentValue = "01";
            } else if (monthNum > 12) {
              segmentValue = "12";
            }
          }
        } else if (segment === "day") {
          const dayNum = parseInt(segmentValue, 10);
          if (segmentValue.length === 1 && dayNum >= 4 && dayNum <= 9) {
            segmentValue = `0${dayNum}`;
          } else if (segmentValue.length === 2) {
            const yearNum = parseInt(internalValue.year || "2000", 10);
            const monthNum = parseInt(internalValue.month || "1", 10);
            const lastDayOfCurrentMonth = lastDayOfMonth(new Date(yearNum, monthNum - 1)).getDate();
            if (dayNum === 0) {
              segmentValue = "01";
            } else if (dayNum > lastDayOfCurrentMonth) {
              segmentValue = String(lastDayOfCurrentMonth).padStart(2, "0");
            }
          }
        }

        // Build next state and re-clamp day if year or month changed
        let nextInternalValue = { ...internalValue, [segment]: segmentValue };
        if (segment !== "day" && nextInternalValue.day) {
          nextInternalValue = {
            ...nextInternalValue,
            day: clampDayForYearMonth(nextInternalValue),
          };
        }

        const previousSegmentValue = internalValue[segment] || "";
        setInternalValue(nextInternalValue);
        commitIfCompleteAndValid(nextInternalValue);

        // Auto-advance (day never auto-advances)
        const shouldAdvance =
          (segment === "year" && segmentValue.length === SEG_MAX.year) ||
          (segment === "month" &&
            (segmentValue.length === SEG_MAX.month ||
              (segmentValue.length === 1 && parseInt(segmentValue, 10) >= 2)));

        if (shouldAdvance && segmentValue !== previousSegmentValue) {
          requestAnimationFrame(() => {
            if (segment === "year") {
              monthRef.current?.focus();
            } else if (segment === "month") {
              dayRef.current?.focus();
            }
          });
        }
      },
      [internalValue, commitIfCompleteAndValid],
    );

    const ctx = React.useMemo<DateSegmentsContextValue>(
      () => ({
        values: internalValue,
        refs: { year: yearRef, month: monthRef, day: dayRef },
        disabled,
        handleKeyDown,
        handleSegmentInput,
        padOnBlur,
      }),
      [internalValue, disabled, handleKeyDown, handleSegmentInput, padOnBlur],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);

    return (
      <div ref={containerRef} className="SegmentedDateInput">
        <DateSegmentsContext.Provider value={ctx}>
          {(["year", "month", "day"] as const).map((seg, i) => (
            <React.Fragment key={seg}>
              <DateSegmentInput segmentType={seg} />
              {i < 2 && <span className="SegmentedDateInput-separator">-</span>}
            </React.Fragment>
          ))}
        </DateSegmentsContext.Provider>
      </div>
    );
  },
);

SegmentedDateInput.displayName = "SegmentedDateInput";

export { SegmentedDateInput };
export type { SegmentedDateInputProps };
