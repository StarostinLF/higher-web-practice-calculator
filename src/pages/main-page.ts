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
import { tw } from '../utils/tw';
import { parseAmount } from '../utils/validation';

import type { Transaction } from '../models/schemas';

function renderHistoryPreview(
	transactions: Transaction[],
	metrics: ReturnType<typeof calculateMetrics>,
): HTMLElement {
	const wrapper = document.createElement('div');
	wrapper.className = tw('hidden sm:block');

	const card = document.createElement('section');
	card.className = tw('card');

	const title = document.createElement('h3');
	title.className = tw('h3');
	title.textContent = 'История расходов';
	card.appendChild(title);

	const subtitle = document.createElement('p');
	subtitle.className = tw('mt-1 text-primary xs:text-base sm:text-sm');
	subtitle.textContent = `Средние траты в день: ${formatMoney(metrics.averageDailySpending)}`;
	card.appendChild(subtitle);

	if (transactions.length === 0) {
		const empty = document.createElement('p');
		empty.className = tw('mt-4 text-sm text-text-secondary');
		empty.textContent = 'Пока нет записей.';
		card.appendChild(empty);
	} else {
		const list = document.createElement('ul');
		list.className = tw('mt-3 divide-y divide-text-secondary');
		for (const tx of transactions) {
			const li = document.createElement('li');
			li.className = tw('flex items-center justify-between py-3');
			const amountEl = document.createElement('span');
			amountEl.className = `font-semibold ${tx.type === 'income' ? 'text-(--color-success)' : ''}`;
			amountEl.textContent = `${tx.type === 'income' ? '+' : ''}${formatMoney(tx.amount)}`;
			const date = document.createElement('span');
			date.className = tw('text-sm text-text-secondary');
			date.textContent = formatDate(tx.date.slice(0, 10));
			li.appendChild(amountEl);
			li.appendChild(date);
			list.appendChild(li);
		}
		card.appendChild(list);
	}

	const fullBtn = document.createElement('button');
	fullBtn.type = 'button';
	fullBtn.className = tw('btn-outline mt-4');
	fullBtn.textContent = 'Смотреть всю историю';
	fullBtn.addEventListener('click', () => navigate('history'));
	card.appendChild(fullBtn);

	wrapper.appendChild(card);
	return wrapper;
}

function renderBalanceCard(metrics: ReturnType<typeof calculateMetrics>): HTMLElement {
	const card = document.createElement('section');
	card.className = tw('card');

	const head = document.createElement('div');
	head.className = tw('flex items-baseline justify-between');
	const title = document.createElement('span');
	title.className = tw('text-text-secondary xs:text-base sm:text-xs sm:leading-[1.4]');
	title.textContent = 'Общий баланс';
	const daily = document.createElement('span');
	daily.className = tw('font-medium text-primary xs:text-base sm:text-sm');
	daily.textContent = `${formatMoney(metrics.dailyBudget)} в день`;
	head.appendChild(title);
	head.appendChild(daily);
	card.appendChild(head);

	const amountRow = document.createElement('div');
	amountRow.className = tw('mt-2 flex items-baseline gap-2');
	const amount = document.createElement('span');
	amount.className = tw('text-amount');
	amount.textContent = formatMoney(metrics.totalBalance);
	const sub = document.createElement('span');
	sub.className = tw('text-sm text-text-secondary');
	sub.textContent = `на ${formatDaysLabel(metrics.daysRemaining)}`;
	amountRow.appendChild(amount);
	amountRow.appendChild(sub);
	card.appendChild(amountRow);

	const actions = document.createElement('div');
	actions.className = tw('mt-4 grid grid-cols-2 gap-2 sm:block');

	const editBtn = document.createElement('button');
	editBtn.type = 'button';
	editBtn.className = tw('btn-outline');
	editBtn.textContent = 'Изменить';
	editBtn.addEventListener('click', () => navigate('edit'));
	actions.appendChild(editBtn);

	const historyBtn = document.createElement('button');
	historyBtn.type = 'button';
	historyBtn.className = tw('btn-outline sm:hidden');
	historyBtn.textContent = 'История расходов';
	historyBtn.addEventListener('click', () => navigate('history'));
	actions.appendChild(historyBtn);

	card.appendChild(actions);

	return card;
}

function renderTodayCard(metrics: ReturnType<typeof calculateMetrics>): HTMLElement {
	const card = document.createElement('section');
	card.className = tw('card');

	const title = document.createElement('span');
	title.className = tw('text-text-secondary xs:text-base sm:text-xs sm:leading-[1.4]');
	title.textContent = 'На сегодня доступно';
	card.appendChild(title);

	const remainingValue = metrics.todayRemaining;
	const accentColor = remainingValue === 0 ? 'var(--color-error)' : 'var(--color-success)';

	const amountRow = document.createElement('div');
	amountRow.className = tw('mt-2 flex items-baseline gap-1');

	const remaining = document.createElement('span');
	remaining.className = tw('text-amount');
	remaining.style.color = accentColor;
	remaining.textContent = formatMoney(remainingValue);

	const divider = document.createElement('span');
	divider.className = tw('text-amount text-text-secondary');
	divider.textContent = ' / ';

	const dailyTotal = document.createElement('span');
	dailyTotal.className = tw('text-amount text-text-secondary');
	dailyTotal.textContent = formatMoney(metrics.dailyBudget);

	amountRow.appendChild(remaining);
	amountRow.appendChild(divider);
	amountRow.appendChild(dailyTotal);
	card.appendChild(amountRow);

	const noBalance = metrics.totalBalance === 0;

	const status = document.createElement('p');
	status.className = tw('mt-2 xs:text-xs sm:text-sm');
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
	form.className = tw('mt-3 flex flex-col gap-3');
	form.noValidate = true;

	const txInput = createInput({
		label: 'Введите трату',
		placeholder: '0 ₽',
		inputMode: 'decimal',
		ariaLabel: 'Сумма траты',
	});
	form.appendChild(txInput);

	const inputEl = txInput.querySelector('input');
	if (metrics.todayRemaining <= 0 && inputEl) {
		inputEl.disabled = true;
	}

	inputEl?.addEventListener('input', () => {
		clearInputError(txInput);
	});

	const saveBtn = document.createElement('button');
	saveBtn.type = 'submit';
	saveBtn.className = tw('btn-primary hidden');
	saveBtn.textContent = 'Списать';
	if (metrics.todayRemaining <= 0) {
		saveBtn.disabled = true;
	}
	form.appendChild(saveBtn);

	txInput.querySelector('input')?.addEventListener('input', e => {
		const hasValue = (e.target as HTMLInputElement).value.trim() !== '';
		saveBtn.classList.toggle('hidden', !hasValue || metrics.todayRemaining <= 0);
	});

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
				`Сумма превышает остаток на сегодня (${formatMoney(metrics.todayRemaining)})`,
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
		saveBtn.classList.add('hidden');
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
	wrapper.className = tw('mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6');

	wrapper.appendChild(renderBalanceCard(metrics));
	wrapper.appendChild(renderTodayCard(metrics));
	wrapper.appendChild(renderHistoryPreview(state.transactions, metrics));

	root.appendChild(wrapper);
}

function renderExpired(root: HTMLElement): void {
	const wrapper = document.createElement('div');
	wrapper.className = tw('mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8 text-center');

	const heading = document.createElement('h1');
	heading.className = tw('h1');
	heading.textContent = 'Период завершён';
	wrapper.appendChild(heading);

	const text = document.createElement('p');
	text.className = tw('text-text-secondary');
	text.textContent = 'Создайте новый бюджет, чтобы продолжить отслеживать расходы.';
	wrapper.appendChild(text);

	const newBtn = document.createElement('button');
	newBtn.type = 'button';
	newBtn.className = tw('btn-primary');
	newBtn.textContent = 'Начать заново';
	newBtn.addEventListener('click', () => {
		void resetBudget();
	});
	wrapper.appendChild(newBtn);

	root.appendChild(wrapper);
}
