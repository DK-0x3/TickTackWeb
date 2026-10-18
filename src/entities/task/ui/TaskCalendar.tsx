import { DayPicker, useDayPicker, type DropdownProps } from 'react-day-picker';
import { enUS, ru, zhCN } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

import { ScheduleSelect } from './ScheduleSelect';
import styles from './TaskSchedulePicker.module.scss';

interface TaskCalendarProps {
  language: string;
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
}

function MonthDropdown({ value, options, disabled, 'aria-label': ariaLabel }: DropdownProps) {
  const { months, goToMonth } = useDayPicker();
  const displayedMonth = months[0]?.date;

  return (
    <ScheduleSelect
      ariaLabel={ariaLabel ?? ''}
      disabled={Boolean(disabled)}
      options={(options ?? []).map(({ value: optionValue, label, disabled: optionDisabled }) => ({
        value: String(optionValue),
        label,
        disabled: optionDisabled,
      }))}
      value={String(value)}
      onValueChange={(selectedMonth) => {
        if (displayedMonth) {
          goToMonth(new Date(displayedMonth.getFullYear(), Number(selectedMonth), 1, 12));
        }
      }}
    />
  );
}

function YearDropdown({ value, options, disabled, 'aria-label': ariaLabel }: DropdownProps) {
  const { months, goToMonth } = useDayPicker();
  const displayedMonth = months[0]?.date;

  return (
    <ScheduleSelect
      ariaLabel={ariaLabel ?? ''}
      disabled={Boolean(disabled)}
      options={(options ?? []).map(({ value: optionValue, label, disabled: optionDisabled }) => ({
        value: String(optionValue),
        label,
        disabled: optionDisabled,
      }))}
      value={String(value)}
      onValueChange={(selectedYear) => {
        if (displayedMonth) {
          goToMonth(new Date(Number(selectedYear), displayedMonth.getMonth(), 1, 12));
        }
      }}
    />
  );
}

export function TaskCalendar({ language, selectedDate, onSelect }: TaskCalendarProps) {
  const locale = language === 'ru' ? ru : language === 'zh-CN' ? zhCN : enUS;
  const currentYear = new Date().getFullYear();
  const selectedYear = selectedDate?.getFullYear() ?? currentYear;

  return (
    <DayPicker
      className={styles.calendar ?? ''}
      mode="single"
      captionLayout="dropdown"
      navLayout="after"
      selected={selectedDate}
      {...(selectedDate ? { defaultMonth: selectedDate } : {})}
      startMonth={new Date(Math.min(currentYear - 100, selectedYear), 0, 1, 12)}
      endMonth={new Date(Math.max(currentYear + 50, selectedYear), 11, 1, 12)}
      locale={locale}
      components={{ MonthsDropdown: MonthDropdown, YearsDropdown: YearDropdown }}
      onSelect={(date) => {
        if (date) onSelect(date);
      }}
    />
  );
}
