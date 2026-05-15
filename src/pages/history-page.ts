import { calculateMetrics } from '../services/budget-calculator';
import { formatDate, formatMoney } from '../utils/format';
import { getState, navigate, removeTransaction } from '../utils/state';

export function renderHistoryPage(root: HTMLElement): void {
  root.innerHTML = '';

  const state = getState();

  const wrapper = document.createElement('div');
  wrapper.className = 'mx-auto flex w-full max-w-xl flex-col px-4 py-6';

  const card = document.createElement('section');
  card.className = 'card';

  const heading = document.createElement('h1');
  heading.className = 'h1';
  heading.textContent = 'История расходов';
  card.appendChild(heading);

  const subtitle = document.createElement('p');
  subtitle.className = 'mt-1 text-sm text-(--color-primary)';
  if (state.budget) {
    const metrics = calculateMetrics(state.budget, state.transactions);
    subtitle.textContent = `Средние траты в день: ${formatMoney(metrics.averageDailySpending)}`;
  } else {
    subtitle.textContent = 'Средние траты в день: —';
  }
  card.appendChild(subtitle);

  const expenses = state.transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'mt-6 text-center text-(--color-text-secondary)';
    empty.textContent = 'Пока нет записей.';
    card.appendChild(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'mt-3 divide-y divide-(--color-text-secondary)';

    for (const tx of expenses) {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between gap-3 py-3';

      const amount = document.createElement('span');
      amount.className = 'font-semibold';
      amount.textContent = formatMoney(tx.amount);

      const right = document.createElement('div');
      right.className = 'flex items-center gap-3';

      const date = document.createElement('span');
      date.className = 'text-sm text-(--color-text-secondary)';
      date.textContent = formatDate(tx.date.slice(0, 10));
      right.appendChild(date);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.setAttribute('aria-label', 'Удалить транзакцию');
      deleteBtn.className =
        'flex h-8 w-8 items-center justify-center rounded-lg text-(--color-text-secondary) transition-colors hover:bg-red-50 hover:text-(--color-error)';
      deleteBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      deleteBtn.addEventListener('click', () => {
        void removeTransaction(tx.id);
      });
      right.appendChild(deleteBtn);

      li.appendChild(amount);
      li.appendChild(right);
      list.appendChild(li);
    }
    card.appendChild(list);
  }

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn-outline mt-6';
  backBtn.textContent = 'Вернуться';
  backBtn.addEventListener('click', () => navigate('main'));
  card.appendChild(backBtn);

  wrapper.appendChild(card);
  root.appendChild(wrapper);
}
