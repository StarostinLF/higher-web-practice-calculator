import { startOfDay } from 'date-fns';

import {
  clearInputError,
  createInput,
  focusInput,
  getInputValue,
  setInputError,
  setInputValue,
} from '../components/input';
import { calculateMetrics } from '../services/budget-calculator';
import { formatDate, formatDaysLabel, formatMoney, makeTxId } from '../utils/format';
import { addTransaction, getState, navigate, resetBudget } from '../utils/state';
import { parseAmount } from '../utils/validation';

import type { Transaction } from '../models/schemas';

function renderHistoryPreview(
  transactions: Transaction[],
  metrics: ReturnType<typeof calculateMetrics>
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'hidden sm:block';

  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('h3');
  title.className = 'h3';
  title.textContent = 'История расходов';
  card.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'mt-1 text-sm text-(--color-primary)';
  subtitle.textContent = `Средние траты в день: ${formatMoney(metrics.averageDailySpending)}`;
  card.appendChild(subtitle);

  const expenses = transactions.filter(t => t.type === 'expense').slice(0, 3);

  if (expenses.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'mt-4 text-sm text-(--color-text-secondary)';
    empty.textContent = 'Пока нет записей.';
    card.appendChild(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'mt-3 divide-y divide-(--color-border)';
    for (const tx of expenses) {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between py-3';
      const amountEl = document.createElement('span');
      amountEl.className = 'font-semibold';
      amountEl.textContent = formatMoney(tx.amount);
      const date = document.createElement('span');
      date.className = 'text-sm text-(--color-text-secondary)';
      date.textContent = formatDate(tx.date.slice(0, 10));
      li.appendChild(amountEl);
      li.appendChild(date);
      list.appendChild(li);
    }
    card.appendChild(list);
  }

  const fullBtn = document.createElement('button');
  fullBtn.type = 'button';
  fullBtn.className = 'btn-outline mt-4';
  fullBtn.textContent = 'Смотреть всю историю';
  fullBtn.addEventListener('click', () => navigate('history'));
  card.appendChild(fullBtn);

  wrapper.appendChild(card);
  return wrapper;
}

function renderBalanceCard(metrics: ReturnType<typeof calculateMetrics>): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card';

  const head = document.createElement('div');
  head.className = 'flex items-baseline justify-between';
  const title = document.createElement('span');
  title.className = 'caption';
  title.textContent = 'Общий баланс';
  const daily = document.createElement('span');
  daily.className = 'text-sm font-medium text-(--color-primary)';
  daily.textContent = `${formatMoney(metrics.dailyBudget)} в день`;
  head.appendChild(title);
  head.appendChild(daily);
  card.appendChild(head);

  const amountRow = document.createElement('div');
  amountRow.className = 'mt-2 flex items-baseline gap-2';
  const amount = document.createElement('span');
  amount.className = 'text-amount';
  amount.textContent = formatMoney(metrics.totalBalance);
  const sub = document.createElement('span');
  sub.className = 'text-sm text-(--color-text-secondary)';
  sub.textContent = `на ${formatDaysLabel(metrics.daysRemaining)}`;
  amountRow.appendChild(amount);
  amountRow.appendChild(sub);
  card.appendChild(amountRow);

  const actions = document.createElement('div');
  actions.className = 'mt-4 grid grid-cols-2 gap-2 sm:block';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn-outline px-2 sm:px-4';
  editBtn.textContent = 'Изменить';
  editBtn.addEventListener('click', () => navigate('edit'));
  actions.appendChild(editBtn);

  const historyBtn = document.createElement('button');
  historyBtn.type = 'button';
  historyBtn.className = 'btn-outline sm:hidden px-2 sm:px-4';
  historyBtn.textContent = 'История расходов';
  historyBtn.addEventListener('click', () => navigate('history'));
  actions.appendChild(historyBtn);

  card.appendChild(actions);

  return card;
}

function renderTodayCard(metrics: ReturnType<typeof calculateMetrics>): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('span');
  title.className = 'caption';
  title.textContent = 'На сегодня доступно';
  card.appendChild(title);

  const remainingValue = metrics.todayRemaining;
  const accentColor = remainingValue === 0 ? 'var(--color-error)' : 'var(--color-success)';

  const amountRow = document.createElement('div');
  amountRow.className = 'mt-2 flex items-baseline gap-1';

  const remaining = document.createElement('span');
  remaining.className = 'text-amount';
  remaining.style.color = accentColor;
  remaining.textContent = formatMoney(remainingValue);

  const divider = document.createElement('span');
  divider.className = 'text-amount text-(--color-text-secondary)';
  divider.textContent = ' / ';

  const dailyTotal = document.createElement('span');
  dailyTotal.className = 'text-amount text-(--color-text-secondary)';
  dailyTotal.textContent = formatMoney(metrics.dailyBudget);

  amountRow.appendChild(remaining);
  amountRow.appendChild(divider);
  amountRow.appendChild(dailyTotal);
  card.appendChild(amountRow);

  const noBalance = metrics.totalBalance === 0;

  const status = document.createElement('p');
  status.className = 'mt-2 text-sm';
  if (noBalance) {
    status.style.color = 'var(--color-error)';
    status.textContent = '🚫 Баланс исчерпан — списание невозможно.';
  } else if (remainingValue === 0) {
    status.style.color = 'var(--color-text-main)';
    status.textContent = '⚠️ Дневной лимит исчерпан';
  } else {
    status.style.color = 'var(--color-text-main)';
    status.textContent = '🎉 Отлично справились — сегодня вы в пределах лимита!';
  }
  card.appendChild(status);

  const form = document.createElement('form');
  form.className = 'mt-3 flex flex-col gap-3';
  form.noValidate = true;

  const txInput = createInput({
    label: 'Введите трату',
    placeholder: '0 ₽',
    inputMode: 'numeric',
    ariaLabel: 'Сумма траты',
  });
  form.appendChild(txInput);

  txInput.querySelector('input')?.addEventListener('input', () => {
    clearInputError(txInput);
  });

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Сохранить';
  if (metrics.todayRemaining <= 0) {
    saveBtn.disabled = true;
  }
  form.appendChild(saveBtn);

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearInputError(txInput);

    const amount = parseAmount(getInputValue(txInput));
    if (amount <= 0) {
      setInputError(txInput, 'Введите сумму больше 0');
      return;
    }

    if (amount > metrics.todayRemaining) {
      setInputError(
        txInput,
        `Сумма превышает остаток на сегодня (${formatMoney(metrics.todayRemaining)})`
      );
      return;
    }

    const tx: Transaction = {
      id: makeTxId(),
      amount,
      date: new Date().toISOString(),
      type: 'expense',
    };
    setInputValue(txInput, '');
    void addTransaction(tx);
  });

  card.appendChild(form);

  setTimeout(() => focusInput(txInput), 0);

  return card;
}

export function renderMainPage(root: HTMLElement): void {
  root.innerHTML = '';

  const state = getState();
  if (!state.budget) {
    return;
  }

  const today = startOfDay(new Date());
  const budgetEnd = startOfDay(new Date(state.budget.endDate));
  if (today > budgetEnd) {
    renderExpired(root);
    return;
  }

  const metrics = calculateMetrics(state.budget, state.transactions);

  const wrapper = document.createElement('div');
  wrapper.className = 'mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6';

  wrapper.appendChild(renderBalanceCard(metrics));
  wrapper.appendChild(renderTodayCard(metrics));
  wrapper.appendChild(renderHistoryPreview(state.transactions, metrics));

  root.appendChild(wrapper);
}

function renderExpired(root: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8 text-center';

  const heading = document.createElement('h1');
  heading.className = 'h1';
  heading.textContent = 'Период завершён';
  wrapper.appendChild(heading);

  const text = document.createElement('p');
  text.className = 'text-(--color-text-secondary)';
  text.textContent = 'Создайте новый бюджет, чтобы продолжить отслеживать расходы.';
  wrapper.appendChild(text);

  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'btn-primary';
  newBtn.textContent = 'Начать заново';
  newBtn.addEventListener('click', () => {
    void resetBudget();
  });
  wrapper.appendChild(newBtn);

  root.appendChild(wrapper);
}
