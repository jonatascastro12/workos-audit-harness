"use client";

import { CalendarIcon, Cross2Icon } from "@radix-ui/react-icons";
import * as React from "react";
import { ComposedDate } from "../helpers/date-picker-helpers.js";
import type { MarginProps } from "../props.js";
import { type CalendarRef, Calendar } from "./calendar.js";
import { IconButton } from "./icon-button.js";
import { Popover } from "./popover.js";
import { type SegmentedDateInputRef, SegmentedDateInput } from "./segmented-date-input.js";

export interface DatePickerRef {
  focusSegment: (segment: "year" | "month" | "day") => void;
}

interface DatePickerProps extends MarginProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  calendarPopoverAlign?: "center" | "start" | "end";
}

const DatePicker = React.forwardRef<DatePickerRef, DatePickerProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      minDate,
      maxDate,
      calendarPopoverAlign = "start",
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [partialDate, setPartialDate] = React.useState<ComposedDate | undefined>(undefined);
    const inputAreaRef = React.useRef<HTMLDivElement>(null);
    const segmentedDateInputRef = React.useRef<SegmentedDateInputRef>(null);
    const calendarRef = React.useRef<CalendarRef>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        focusSegment: (segment: "year" | "month" | "day") => {
          segmentedDateInputRef.current?.focusSegment(segment);
        },
      }),
      [],
    );

    const handleCalendarChange = React.useCallback(
      (date: Date) => {
        onChange?.(date);
        setIsOpen(false);
      },
      [onChange],
    );

    const handlePartialDateChange = React.useCallback((partial: ComposedDate) => {
      setPartialDate(partial);
    }, []);

    const handleClear = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(undefined);
        setIsOpen(false);
      },
      [onChange],
    );

    const handleTriggerClick = React.useCallback(
      (e: React.MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) {
          return;
        }

        const target = e.target;
        const inputArea = inputAreaRef.current;

        // If click is inside the input area (but not on the icon button)
        if (inputArea && inputArea.contains(target)) {
          const isIconButton = target.closest('[aria-label="Open calendar"]');
          const isInputElement = target.tagName === "INPUT";

          if (!isIconButton) {
            // If clicking on an input and popover is already open, don't toggle
            if (isInputElement && isOpen) {
              e.preventDefault();
              e.stopPropagation();
            } else if (!isOpen && isInputElement) {
              setIsOpen(true);
              requestAnimationFrame(() => {
                if (target instanceof HTMLInputElement) {
                  target.focus();
                }
              });
            } else if (!isInputElement) {
              if (isOpen) {
                e.preventDefault();
                e.stopPropagation();
              } else {
                // If clicking on the trigger area but not on a specific segment, focus the year input
                requestAnimationFrame(() => {
                  segmentedDateInputRef.current?.focusSegment("year");
                });
              }
            }
          }
        }
      },
      [isOpen],
    );

    return (
      <div {...props}>
        <Popover.Root
          open={isOpen}
          onOpenChange={(open) => {
            if (disabled) {
              return;
            }

            setIsOpen(open);

            if (!open) {
              inputAreaRef.current?.blur();
              setPartialDate(undefined);
            }
          }}
        >
          <Popover.Trigger onClick={handleTriggerClick}>
            <div
              ref={inputAreaRef}
              className="DatePickerTriggerArea rt-TextFieldRoot rt-r-size-2 rt-variant-classic"
            >
              <div className="DatePickerTriggerAreaContent">
                <IconButton
                  aria-label="Open calendar"
                  disabled={disabled}
                  size="1"
                  onClick={() => {
                    setIsOpen(!isOpen);
                    // Focus calendar when opening via icon
                    if (!isOpen) {
                      requestAnimationFrame(() => {
                        calendarRef.current?.focus();
                      });
                    }
                  }}
                >
                  <CalendarIcon />
                </IconButton>
                <SegmentedDateInput
                  ref={segmentedDateInputRef}
                  disabled={disabled}
                  maxDate={maxDate}
                  minDate={minDate}
                  open={isOpen}
                  value={value}
                  onChange={onChange}
                  onEnterWhenValid={() => setIsOpen(false)}
                  onPartialDateChange={handlePartialDateChange}
                />
                {value && (
                  <IconButton
                    aria-label="Clear date"
                    className="DatePickerClearButton"
                    disabled={disabled}
                    size="1"
                    onClick={handleClear}
                  >
                    <Cross2Icon />
                  </IconButton>
                )}
              </div>
            </div>
          </Popover.Trigger>
          <Popover.Content align={calendarPopoverAlign} minWidth="258px" width="258px">
            <Calendar
              ref={calendarRef}
              disabled={disabled}
              maxDate={maxDate}
              minDate={minDate}
              partialDate={partialDate}
              value={value}
              onChange={handleCalendarChange}
            />
          </Popover.Content>
        </Popover.Root>
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
export type { DatePickerProps };
