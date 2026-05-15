import { startOfDay } from 'date-fns';

import { toISODate } from '../components/date-input';
import {
  clearInputError,
  createInput,
  focusInput,
  getInputValue,
  setInputError,
} from '../components/input';
import { createPeriodSelect } from '../components/period-select';
import { BudgetInputSchema } from '../models/schemas';
import { setBudget } from '../utils/state';
import { parseAmount, validate } from '../utils/validation';

function setPeriodError(triggerEl: HTMLElement, message: string): void {
  triggerEl.style.borderColor = 'var(--color-error)';
  triggerEl.style.boxShadow = '0 0 0 2px rgb(239 68 68 / 0.15)';
  let errorEl = triggerEl.parentElement?.querySelector<HTMLElement>('.period-error-msg');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'period-error-msg mt-1 block text-sm';
    errorEl.style.color = 'var(--color-error)';
    triggerEl.insertAdjacentElement('afterend', errorEl);
  }
  errorEl.textContent = message;
}

function clearPeriodError(triggerEl: HTMLElement): void {
  triggerEl.style.borderColor = '';
  triggerEl.style.boxShadow = '';
  triggerEl.parentElement?.querySelector('.period-error-msg')?.remove();
}

export function renderStartPage(root: HTMLElement): void {
  root.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-1 items-start justify-center px-4 py-8 sm:items-center';

  const card = document.createElement('section');
  card.className = 'w-full max-w-md rounded-xl bg-white p-6 shadow-(--shadow-e1)';

  const heading = document.createElement('h1');
  heading.className = 'h1 mb-5';
  heading.textContent = 'Начнём!';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'flex flex-col gap-4';
  form.noValidate = true;

  const balanceInput = createInput({
    label: 'Укажите баланс',
    placeholder: 'Стартовый баланс',
    inputMode: 'numeric',
    ariaLabel: 'Стартовый баланс',
  });
  form.appendChild(balanceInput);

  const periodSelect = createPeriodSelect({ label: 'На срок' });
  form.appendChild(periodSelect.element);

  const periodTrigger = periodSelect.element.querySelector<HTMLElement>('button');

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn-primary mt-2';
  submitBtn.textContent = 'Рассчитать';
  form.appendChild(submitBtn);

  card.appendChild(form);
  wrapper.appendChild(card);
  root.appendChild(wrapper);

  focusInput(balanceInput);

  balanceInput.querySelector('input')?.addEventListener('input', () => {
    clearInputError(balanceInput);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearInputError(balanceInput);
    if (periodTrigger) {
      clearPeriodError(periodTrigger);
    }

    const startBalance = parseAmount(getInputValue(balanceInput));
    const endDate = periodSelect.getEndDate();

    const today = startOfDay(new Date());
    const payload = {
      startBalance,
      startDate: toISODate(today),
      endDate: endDate ? toISODate(endDate) : '',
    };

    const result = validate(BudgetInputSchema, payload);
    if (!result.success || !result.data) {
      if (result.errors?.startBalance) {
        setInputError(balanceInput, result.errors.startBalance);
      }
      if (result.errors?.endDate && periodTrigger) {
        setPeriodError(periodTrigger, result.errors.endDate);
      }
      return;
    }

    void setBudget({ id: 'current', ...result.data });
  });
}
