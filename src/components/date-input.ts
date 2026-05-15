import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

export interface DateInputOptions {
  initialDate?: Date;
  minDate?: Date;
  onChange?: (date: Date) => void;
}

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function dayOfWeek(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export function createDateInput(options: DateInputOptions = {}): {
  element: HTMLDivElement;
  getDate: () => Date;
  setDate: (date: Date) => void;
} {
  let currentDate = options.initialDate ? startOfDay(options.initialDate) : startOfDay(new Date());
  let viewMonth = startOfMonth(currentDate);
  const minDate = options.minDate ? startOfDay(options.minDate) : null;

  const container = document.createElement('div');
  container.className = 'rounded-xl border border-(--color-border) bg-white p-4';

  const header = document.createElement('div');
  header.className = 'mb-3 flex items-center justify-between';

  const monthLabel = document.createElement('span');
  monthLabel.className = 'text-base font-semibold capitalize';

  const yearLabel = document.createElement('span');
  yearLabel.className = 'text-base font-semibold text-(--color-text-secondary)';

  header.appendChild(monthLabel);
  header.appendChild(yearLabel);

  const navRow = document.createElement('div');
  navRow.className = 'mb-2 flex items-center justify-between';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className =
    'flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-secondary) hover:bg-gray-100';
  prevBtn.setAttribute('aria-label', 'Предыдущий месяц');
  prevBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className =
    'flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-secondary) hover:bg-gray-100';
  nextBtn.setAttribute('aria-label', 'Следующий месяц');
  nextBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  navRow.appendChild(prevBtn);
  navRow.appendChild(nextBtn);

  const weekdaysRow = document.createElement('div');
  weekdaysRow.className =
    'mb-2 grid grid-cols-7 gap-1 text-center text-xs text-(--color-text-secondary)';
  for (const wd of WEEKDAYS) {
    const cell = document.createElement('div');
    cell.textContent = wd;
    weekdaysRow.appendChild(cell);
  }

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-7 gap-1';

  container.appendChild(header);
  container.appendChild(navRow);
  container.appendChild(weekdaysRow);
  container.appendChild(grid);

  function render(): void {
    monthLabel.textContent = format(viewMonth, 'LLLL', { locale: ru });
    yearLabel.textContent = format(viewMonth, 'yyyy');

    grid.innerHTML = '';
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const startOffset = dayOfWeek(monthStart);

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'h-9';
      grid.appendChild(empty);
    }

    const daysInMonth = monthEnd.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(day);

      const isSelected = isSameDay(date, currentDate);
      const isDisabled = minDate !== null && date < minDate;

      let classes = 'h-9 w-full rounded-xs text-sm transition-colors ';
      if (isSelected) {
        classes += 'bg-(--color-primary) text-white font-medium';
      } else if (isDisabled) {
        classes += 'bg-(--color-bg) text-(--color-text-secondary) cursor-not-allowed opacity-50';
      } else {
        classes += 'bg-(--color-bg) text-(--color-text-main) hover:bg-(--color-border)';
      }

      btn.className = classes;

      if (isDisabled) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          currentDate = date;
          render();
          options.onChange?.(date);
        });
      }

      grid.appendChild(btn);
    }
  }

  prevBtn.addEventListener('click', () => {
    viewMonth = addMonths(viewMonth, -1);
    render();
  });

  nextBtn.addEventListener('click', () => {
    viewMonth = addMonths(viewMonth, 1);
    render();
  });

  render();

  return {
    element: container,
    getDate: () => currentDate,
    setDate: (date: Date) => {
      currentDate = startOfDay(date);
      viewMonth = startOfMonth(currentDate);
      render();
    },
  };
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromISODate(iso: string): Date {
  return parseISO(iso);
}
