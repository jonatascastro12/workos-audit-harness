"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import * as React from "react";
import { ComposedDate } from "../helpers/date-picker-helpers.js";
import type { MarginProps } from "../props.js";
import { Button } from "./button.js";
import { IconButton } from "./icon-button.js";
import { Text } from "./text.js";

interface CalendarRef {
  focus: () => void;
}

interface CalendarProps extends MarginProps {
  value?: Date;
  onChange?: (date: Date) => void;
  partialDate?: ComposedDate;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const Calendar = React.forwardRef<CalendarRef, CalendarProps>(
  (
    { value, onChange, partialDate, minDate, maxDate, disabled = false, className, ...props },
    forwardedRef,
  ) => {
    const calendarGridRef = React.useRef<HTMLDivElement>(null);
    const focusedButtonRef = React.useRef<HTMLButtonElement>(null);
    const focusedDateRef = React.useRef<Date>(startOfDay(value || new Date()));
    const [currentMonth, setCurrentMonth] = React.useState(() => value || new Date());
    const [focusRenderKey, setFocusRenderKey] = React.useState(0);
    const updateFocusedDate = React.useCallback((newDate: Date, shouldFocus = false) => {
      focusedDateRef.current = startOfDay(newDate);
      setFocusRenderKey((prev) => prev + 1);

      if (shouldFocus) {
        requestAnimationFrame(() => {
          focusedButtonRef.current?.focus();
        });
      }
    }, []);

    React.useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => {
          focusedButtonRef.current?.focus();
        },
      }),
      [],
    );

    React.useEffect(() => {
      if (value) {
        setCurrentMonth(value);
      }
    }, [value]);

    // Update current year & month based on partial date input
    React.useEffect(() => {
      if (partialDate && partialDate.year) {
        const year = parseInt(partialDate.year, 10);
        const todaysMonth = new Date().getMonth();

        // Only update if we have a valid year
        if (year >= 1000) {
          let targetDate: Date;

          if (partialDate.month) {
            const month = parseInt(partialDate.month, 10);
            if (month >= 1 && month <= 12) {
              // Both year and month are valid
              targetDate = new Date(year, month - 1, 1);
            } else {
              // Year is valid but month is invalid, use current month
              targetDate = new Date(year, todaysMonth, 1);
            }
          } else {
            // Only year is provided, use current month of that year
            targetDate = new Date(year, todaysMonth, 1);
          }

          if (!isSameMonth(targetDate, currentMonth)) {
            setCurrentMonth(targetDate);
          }

          updateFocusedDate(targetDate, false); // Don't focus, just update for keyboard nav
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partialDate, updateFocusedDate]);

    // Generate calendar grid
    const calendarDays = React.useMemo(() => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);

      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const goToPrevMonth = React.useCallback(() => {
      setCurrentMonth((prev) => subMonths(prev, 1));
    }, []);

    const goToNextMonth = React.useCallback(() => {
      setCurrentMonth((prev) => addMonths(prev, 1));
    }, []);

    const isPrevMonthDisabled =
      disabled ||
      (minDate !== undefined &&
        minDate !== null &&
        isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(minDate)));

    const isNextMonthDisabled =
      disabled ||
      (maxDate !== undefined &&
        maxDate !== null &&
        isAfter(startOfMonth(addMonths(currentMonth, 1)), startOfDay(maxDate)));

    const handleDateClick = React.useCallback(
      (date: Date) => {
        if (disabled) {
          return;
        }

        if (minDate && isBefore(date, minDate)) {
          return;
        }

        if (maxDate && isAfter(date, maxDate)) {
          return;
        }

        onChange?.(date);
        updateFocusedDate(date, true); // Focus after clicking
      },
      [onChange, disabled, minDate, maxDate, updateFocusedDate],
    );

    const isDateDisabled = React.useCallback(
      (date: Date) => {
        if (disabled) {
          return true;
        }

        if (minDate && isBefore(date, minDate)) {
          return true;
        }

        if (maxDate && isAfter(date, maxDate)) {
          return true;
        }

        return false;
      },
      [disabled, minDate, maxDate],
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (disabled) {
          return;
        }

        const currentFocused = focusedDateRef.current;
        let newFocusedDate: Date | null = null;

        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            newFocusedDate = subDays(currentFocused, 1);
            break;
          case "ArrowRight":
            event.preventDefault();
            newFocusedDate = addDays(currentFocused, 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            newFocusedDate = subDays(currentFocused, 7);
            break;
          case "ArrowDown":
            event.preventDefault();
            newFocusedDate = addDays(currentFocused, 7);
            break;
          case "Enter":
          case " ":
            event.preventDefault();
            if (!isDateDisabled(currentFocused)) {
              onChange?.(currentFocused);
            }

            return;
          default:
            return;
        }

        if (newFocusedDate && !isSameDay(newFocusedDate, currentFocused)) {
          const calendarStart = startOfWeek(startOfMonth(currentMonth));
          const calendarEnd = endOfWeek(endOfMonth(currentMonth));

          // Only change month if the new date is outside the current grid
          const isOutsideGrid = newFocusedDate < calendarStart || newFocusedDate > calendarEnd;

          if (isOutsideGrid) {
            setCurrentMonth(newFocusedDate);
          }

          updateFocusedDate(newFocusedDate, true); // Focus after keyboard navigation
        }
      },
      [disabled, currentMonth, isDateDisabled, onChange, updateFocusedDate],
    );

    const days = React.useMemo(
      () =>
        calendarDays.map((date) => {
          const time = date.getTime();
          return {
            date,
            time,
            isSelected: value && isSameDay(date, value),
            isCurrentMonth: isSameMonth(date, currentMonth),
            isToday: isToday(date),
            shouldFocus: isSameDay(date, focusedDateRef.current),
            isDisabled: isDateDisabled(date),
            dayString: format(date, "d"),
          };
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        calendarDays,
        value,
        currentMonth,
        isDateDisabled,
        focusRenderKey, // Need this to re-evaluate when focusedDateRef changes
      ],
    );

    return (
      <div className={classNames("calendar", className)} {...props}>
        <div className="CalendarHeader">
          <IconButton
            aria-label="Previous month"
            className="CalendarNavButton"
            disabled={isPrevMonthDisabled}
            onClick={goToPrevMonth}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Text className="CalendarHeading" size="2" weight="bold">
            {format(currentMonth, "MMMM yyyy")}
          </Text>

          <IconButton
            aria-label="Next month"
            className="CalendarNavButton"
            disabled={isNextMonthDisabled}
            onClick={goToNextMonth}
          >
            <ChevronRightIcon />
          </IconButton>
        </div>

        <div className="CalendarWeekdays">
          {WEEKDAYS.map((day) => (
            <Text key={day} align="center" color="gray" size="2">
              {day}
            </Text>
          ))}
        </div>

        <div
          ref={calendarGridRef}
          aria-label={format(currentMonth, "MMMM yyyy")}
          className="CalendarGrid"
          role="grid"
        >
          {days.map((day) => (
            <div key={day.time} className="CalendarCellContainer">
              <Button
                ref={day.shouldFocus ? focusedButtonRef : null}
                ghost
                aria-disabled={day.isDisabled}
                aria-selected={day.isSelected}
                disabled={day.isDisabled}
                role="gridcell"
                tabIndex={day.shouldFocus ? 0 : -1}
                className={classNames("CalendarDayButton", {
                  "calendar-cell--today": day.isToday && !day.isSelected,
                  "calendar-cell--other-month": !day.isCurrentMonth,
                })}
                onClick={() => handleDateClick(day.date)}
                onKeyDown={day.shouldFocus ? handleKeyDown : undefined}
              >
                {day.dayString}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps, CalendarRef };
