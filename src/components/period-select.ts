import { addDays, addWeeks, addMonths, endOfMonth, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { createDateInput } from './date-input';

export interface PeriodOption {
  id: string;
  label: string;
  hint?: string;
  resolve: (from: Date) => Date | 'custom';
}

export interface PeriodSelectOptions {
  label?: string;
  initialDate?: Date;
  onChange?: (endDate: Date) => void;
}

function buildOptions(from: Date): PeriodOption[] {
  const formatHint = (date: Date): string => `до ${format(date, 'd MMMM', { locale: ru })}`;

  return [
    {
      id: 'day',
      label: 'День',
      get hint(): string {
        return formatHint(addDays(from, 1));
      },
      resolve: f => addDays(f, 1),
    },
    {
      id: 'week',
      label: 'Неделя',
      get hint(): string {
        return formatHint(addWeeks(from, 1));
      },
      resolve: f => addWeeks(f, 1),
    },
    {
      id: '2weeks',
      label: '2 недели',
      get hint(): string {
        return formatHint(addWeeks(from, 2));
      },
      resolve: f => addWeeks(f, 2),
    },
    {
      id: 'month',
      label: 'Месяц',
      get hint(): string {
        return formatHint(addMonths(from, 1));
      },
      resolve: f => addMonths(f, 1),
    },
    {
      id: 'eom',
      label: 'До конца месяца',
      get hint(): string {
        return formatHint(endOfMonth(from));
      },
      resolve: f => endOfMonth(f),
    },
    {
      id: 'custom',
      label: 'Своя дата',
      resolve: () => 'custom',
    },
  ];
}

function diffDays(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatSelectedLabel(from: Date, to: Date): string {
  const days = diffDays(from, to);
  const dayWord = days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней';
  return `${days} ${dayWord} (до ${format(to, 'd MMMM', { locale: ru })})`;
}

export function createPeriodSelect(options: PeriodSelectOptions = {}): {
  element: HTMLDivElement;
  getEndDate: () => Date | null;
  setEndDate: (date: Date) => void;
} {
  const fromDate = startOfDay(new Date());
  let selectedDate: Date | null = options.initialDate ? startOfDay(options.initialDate) : null;
  let isOpen = false;
  let showCustomCalendar = false;

  const container = document.createElement('div');
  container.className = 'relative';

  if (options.label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'input-label';
    labelEl.textContent = options.label;
    container.appendChild(labelEl);
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className =
    'flex w-full items-center justify-between rounded-sm border border-(--color-border) bg-white px-4 py-3 text-left text-base text-(--color-text-main) focus:border-(--color-primary) focus:outline-none focus:ring-2 focus:ring-blue-100';

  const triggerText = document.createElement('span');
  trigger.appendChild(triggerText);

  const chevron = document.createElement('span');
  chevron.className = 'ml-2 text-(--color-text-secondary) transition-transform';
  chevron.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  trigger.appendChild(chevron);

  container.appendChild(trigger);

  const dropdown = document.createElement('div');
  dropdown.className =
    'absolute left-0 right-0 top-full z-20 mt-2 hidden overflow-hidden rounded-lg border border-(--color-border) bg-white shadow-(--shadow-e2)';
  container.appendChild(dropdown);

  function setSelected(date: Date): void {
    selectedDate = startOfDay(date);
    updateTrigger();
    options.onChange?.(selectedDate);
  }

  function updateTrigger(): void {
    if (selectedDate) {
      triggerText.textContent = formatSelectedLabel(fromDate, selectedDate);
      triggerText.className = 'text-(--color-text-main)';
    } else {
      triggerText.textContent = 'Выберите срок';
      triggerText.className = 'text-(--color-text-secondary)';
    }
  }

  function close(): void {
    isOpen = false;
    showCustomCalendar = false;
    dropdown.classList.add('hidden');
    chevron.style.transform = 'rotate(0deg)';
  }

  function open(): void {
    isOpen = true;
    renderDropdown();
    dropdown.classList.remove('hidden');
    chevron.style.transform = 'rotate(180deg)';
  }

  function renderDropdown(): void {
    dropdown.innerHTML = '';

    if (showCustomCalendar) {
      const calendar = createDateInput({
        initialDate: selectedDate ?? addDays(fromDate, 7),
        minDate: addDays(fromDate, 1),
        onChange: date => {
          setSelected(date);
        },
      });
      calendar.element.classList.remove('border', 'rounded-xl');
      dropdown.appendChild(calendar.element);

      const confirm = document.createElement('div');
      confirm.className = 'border-t border-(--color-border) p-3';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-primary';
      btn.textContent = 'Применить';
      btn.addEventListener('click', () => {
        close();
      });
      confirm.appendChild(btn);
      dropdown.appendChild(confirm);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'max-h-72 overflow-auto';
    for (const opt of buildOptions(fromDate)) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'flex w-full items-center justify-between px-4 py-3 text-left text-base hover:bg-gray-50';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = opt.label;
      labelSpan.className = 'text-(--color-text-main)';
      btn.appendChild(labelSpan);
      if (opt.hint) {
        const hintSpan = document.createElement('span');
        hintSpan.textContent = opt.hint;
        hintSpan.className = 'text-sm text-(--color-text-secondary)';
        btn.appendChild(hintSpan);
      }
      btn.addEventListener('click', () => {
        const result = opt.resolve(fromDate);
        if (result === 'custom') {
          showCustomCalendar = true;
          renderDropdown();
          return;
        }
        setSelected(result);
        close();
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    dropdown.appendChild(list);
  }

  trigger.addEventListener('click', () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener('click', event => {
    if (!event.composedPath().includes(container)) {
      close();
    }
  });

  updateTrigger();

  return {
    element: container,
    getEndDate: () => selectedDate,
    setEndDate: (date: Date) => {
      selectedDate = startOfDay(date);
      updateTrigger();
    },
  };
}
