import { toISODate } from '../components/date-input';
import { clearInputError, createInput, getInputValue, setInputError } from '../components/input';
import { createPeriodSelect } from '../components/period-select';
import { calculateMetrics } from '../services/budget-calculator';
import { formatDaysLabel, formatMoney, makeTxId } from '../utils/format';
import { addTransaction, getState, navigate, setBudget } from '../utils/state';
import { parseAmount } from '../utils/validation';

import type { Budget, Transaction } from '../models/schemas';

export function renderEditBudgetPage(root: HTMLElement): void {
  root.innerHTML = '';

  const state = getState();
  if (!state.budget) {
    navigate('start');
    return;
  }

  const budget: Budget = state.budget;

  const metrics = calculateMetrics(budget, state.transactions);

  const wrapper = document.createElement('div');
  wrapper.className = 'mx-auto flex w-full max-w-xl flex-col px-4 py-6';

  const card = document.createElement('section');
  card.className = 'card';

  const head = document.createElement('div');
  head.className = 'flex items-baseline justify-between';
  const headTitle = document.createElement('span');
  headTitle.className = 'caption';
  headTitle.textContent = 'Общий баланс';
  const headDaily = document.createElement('span');
  headDaily.className = 'text-sm font-medium text-(--color-primary)';
  headDaily.textContent = `${formatMoney(metrics.dailyBudget)} в день`;
  head.appendChild(headTitle);
  head.appendChild(headDaily);
  card.appendChild(head);

  const amountRow = document.createElement('div');
  amountRow.className = 'mt-2 flex items-baseline gap-2';
  const amountEl = document.createElement('span');
  amountEl.className = 'text-amount';
  amountEl.textContent = formatMoney(metrics.totalBalance);
  const sub = document.createElement('span');
  sub.className = 'text-sm text-(--color-text-secondary)';
  sub.textContent = `на ${formatDaysLabel(metrics.daysRemaining)}`;
  amountRow.appendChild(amountEl);
  amountRow.appendChild(sub);
  card.appendChild(amountRow);

  const form = document.createElement('form');
  form.className = 'mt-4 flex flex-col gap-3';
  form.noValidate = true;

  const topupInput = createInput({
    label: 'Пополнить',
    placeholder: '+0 ₽',
    inputMode: 'numeric',
    ariaLabel: 'Сумма пополнения',
  });
  form.appendChild(topupInput);

  const periodSelect = createPeriodSelect({
    label: 'На срок',
    initialDate: new Date(budget.endDate),
  });
  form.appendChild(periodSelect.element);

  const periodError = document.createElement('span');
  periodError.className = 'hidden text-sm';
  periodError.style.color = 'var(--color-error)';
  form.appendChild(periodError);

  const actions = document.createElement('div');
  actions.className = 'mt-2 flex flex-col gap-2';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-outline';
  cancelBtn.textContent = 'Вернуться без сохранения';
  cancelBtn.addEventListener('click', () => navigate('main'));

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Сохранить';

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  function handleSave(): void {
    clearInputError(topupInput);
    periodError.classList.add('hidden');

    const topup = parseAmount(getInputValue(topupInput));
    const endDate = periodSelect.getEndDate();

    let hasError = false;

    if (topup < 0) {
      setInputError(topupInput, 'Сумма не может быть отрицательной');
      hasError = true;
    }

    if (!endDate) {
      periodError.textContent = 'Укажите срок';
      periodError.classList.remove('hidden');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const updated: Budget = {
      id: 'current',
      startBalance: budget.startBalance + (topup > 0 ? topup : 0),
      startDate: budget.startDate,
      endDate: endDate ? toISODate(endDate) : budget.endDate,
    };

    if (topup > 0) {
      const tx: Transaction = {
        id: makeTxId(),
        amount: topup,
        date: new Date().toISOString(),
        type: 'topup',
      };
      void addTransaction(tx).then(() => setBudget(updated));
    } else {
      void setBudget(updated);
    }
  }

  topupInput.querySelector('input')?.addEventListener('input', () => {
    clearInputError(topupInput);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    handleSave();
  });

  card.appendChild(form);
  wrapper.appendChild(card);
  root.appendChild(wrapper);
}
