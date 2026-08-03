import { isValid, lastDayOfMonth, parse } from "date-fns";

export const formatDateValue = (date?: Date) =>
  date
    ? {
        year: String(date.getFullYear()),
        month: String(date.getMonth() + 1).padStart(2, "0"),
        day: String(date.getDate()).padStart(2, "0"),
      }
    : { year: "", month: "", day: "" };

export type ComposedDate = {
  year: string;
  month: string;
  day: string;
};

export const isValidDate = (dateValues: ComposedDate): boolean => {
  const { year, month, day } = dateValues;

  if (!year || !month || !day) {
    return false;
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (Number.isNaN(yearNum) || yearNum < 1000 || yearNum > 9999) {
    return false;
  }

  if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return false;
  }

  if (Number.isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    return false;
  }

  const parsed = parse(
    `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    "yyyy-MM-dd",
    new Date(),
  );

  return isValid(parsed);
};

export const keyFrom = (dateValues: ComposedDate) =>
  `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

export const clampDayForYearMonth = (dateValues: ComposedDate): string => {
  const { year, month, day } = dateValues;

  if (!year || !month || !day) {
    return day;
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (Number.isNaN(yearNum) || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return day;
  }

  const lastDayOfSelectedMonth = lastDayOfMonth(new Date(yearNum, monthNum - 1)).getDate();

  const dayNum = parseInt(day, 10);
  if (Number.isNaN(dayNum)) {
    return day;
  }

  if (dayNum < 1) {
    return "01";
  }

  if (dayNum > lastDayOfSelectedMonth) {
    return String(lastDayOfSelectedMonth).padStart(2, "0");
  }

  return day.padStart(2, "0");
};
