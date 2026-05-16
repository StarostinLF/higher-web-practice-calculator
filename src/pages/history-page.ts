import { calculateMetrics } from '../services/budget-calculator';
import { formatDate, formatMoney } from '../utils/format';
import { getState, navigate, removeTransaction } from '../utils/state';
import { tw } from '../utils/tw';

export function renderHistoryPage(root: HTMLElement): void {
	root.innerHTML = '';

	const state = getState();

	const wrapper = document.createElement('div');
	wrapper.className = tw('mx-auto flex w-full max-w-xl flex-col px-4 py-6 pb-20 sm:pb-6');

	const card = document.createElement('section');
	card.className = tw('card');

	const heading = document.createElement('h1');
	heading.className = tw('h1');
	heading.textContent = 'История расходов';
	card.appendChild(heading);

	const subtitle = document.createElement('p');
	subtitle.className = tw('mt-1 text-primary xs:text-xs sm:text-sm');
	if (state.budget) {
		const metrics = calculateMetrics(state.budget, state.transactions);
		subtitle.textContent = `Средние траты в день: ${formatMoney(metrics.averageDailySpending)}`;
	} else {
		subtitle.textContent = 'Средние траты в день: —';
	}
	card.appendChild(subtitle);

	const transactions = state.transactions;

	if (transactions.length === 0) {
		const empty = document.createElement('p');
		empty.className = tw('mt-6 text-center text-text-secondary');
		empty.textContent = 'Пока нет записей.';
		card.appendChild(empty);
	} else {
		const list = document.createElement('ul');
		list.className = tw('mt-3 divide-y divide-text-secondary');

		for (const tx of transactions) {
			const li = document.createElement('li');
			li.className = tw('flex items-center justify-between gap-3 py-3');

			const isIncome = tx.type === 'income';

			const amount = document.createElement('span');
			amount.className = `font-semibold ${isIncome ? 'text-(--color-success)' : ''}`;
			amount.textContent = `${isIncome ? '+' : ''}${formatMoney(tx.amount)}`;

			const right = document.createElement('div');
			right.className = tw('flex items-center gap-3');

			const date = document.createElement('span');
			date.className = tw('text-sm text-text-secondary');
			date.textContent = formatDate(tx.date.slice(0, 10));
			right.appendChild(date);

			const deleteBtn = document.createElement('button');
			deleteBtn.type = 'button';
			deleteBtn.setAttribute('aria-label', 'Удалить транзакцию');
			deleteBtn.className = tw(
				'flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-red-50 hover:text-error',
			);
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

	const actionBar = document.createElement('div');
	actionBar.className = tw(
		'fixed inset-x-0 bottom-0 bg-surface px-4 pt-3 pb-4 sm:static sm:mt-6 sm:bg-transparent sm:p-0',
	);

	const backBtn = document.createElement('button');
	backBtn.type = 'button';
	backBtn.className = tw('btn-outline');
	backBtn.textContent = 'Вернуться';
	backBtn.addEventListener('click', () => navigate('main'));
	actionBar.appendChild(backBtn);
	card.appendChild(actionBar);

	wrapper.appendChild(card);
	root.appendChild(wrapper);
}
