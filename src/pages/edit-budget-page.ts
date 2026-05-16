import { toISODate } from '../components/date-input';
import { clearInputError, createInput, getInputValue, setInputError } from '../components/input';
import { createPeriodSelect } from '../components/period-select';
import { calculateMetrics } from '../services/budget-calculator';
import { formatDaysLabel, formatMoney, makeTxId } from '../utils/format';
import { addTransaction, getState, navigate, setBudget } from '../utils/state';
import { tw } from '../utils/tw';
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
	wrapper.className = tw('mx-auto flex w-full max-w-xl flex-col px-4 py-6 pb-20 sm:pb-6');

	const card = document.createElement('section');
	card.className = tw('card');

	const head = document.createElement('div');
	head.className = tw('flex items-baseline justify-between');
	const headTitle = document.createElement('span');
	headTitle.className = tw('text-text-secondary xs:text-base sm:text-xs sm:leading-[1.4]');
	headTitle.textContent = 'Общий баланс';
	const headDaily = document.createElement('span');
	headDaily.className = tw('font-medium text-primary xs:text-base sm:text-sm');
	headDaily.textContent = `${formatMoney(metrics.dailyBudget)} в день`;
	head.appendChild(headTitle);
	head.appendChild(headDaily);
	card.appendChild(head);

	const amountRow = document.createElement('div');
	amountRow.className = tw('mt-2 flex items-baseline gap-2');
	const amountEl = document.createElement('span');
	amountEl.className = tw('text-amount');
	amountEl.textContent = formatMoney(metrics.totalBalance);
	const sub = document.createElement('span');
	sub.className = tw('text-sm text-text-secondary');
	sub.textContent = `на ${formatDaysLabel(metrics.daysRemaining)}`;
	amountRow.appendChild(amountEl);
	amountRow.appendChild(sub);
	card.appendChild(amountRow);

	const form = document.createElement('form');
	form.className = tw('mt-4 flex flex-col gap-3');
	form.noValidate = true;

	const incomeInput = createInput({
		label: 'Пополнить',
		placeholder: '+0 ₽',
		inputMode: 'decimal',
		ariaLabel: 'Сумма пополнения',
	});
	form.appendChild(incomeInput);

	const periodSelect = createPeriodSelect({
		label: 'На срок',
		initialDate: new Date(budget.endDate),
	});
	form.appendChild(periodSelect.element);

	const periodError = document.createElement('span');
	periodError.className = tw('hidden text-sm');
	periodError.style.color = 'var(--color-error)';
	form.appendChild(periodError);

	const actions = document.createElement('div');
	actions.className = tw(
		'fixed inset-x-0 bottom-0 flex flex-col gap-2 bg-surface px-4 pt-3 pb-4 sm:static sm:mt-2 sm:bg-transparent sm:p-0',
	);

	const cancelBtn = document.createElement('button');
	cancelBtn.type = 'button';
	cancelBtn.className = tw('btn-outline');
	cancelBtn.textContent = 'Вернуться';
	cancelBtn.addEventListener('click', () => navigate('main'));

	incomeInput.querySelector('input')?.addEventListener('input', e => {
		const hasValue = (e.target as HTMLInputElement).value.trim() !== '';
		cancelBtn.textContent = hasValue ? 'Вернуться без сохранения' : 'Вернуться';
		saveBtn.classList.toggle('hidden', !hasValue);
	});

	const saveBtn = document.createElement('button');
	saveBtn.type = 'submit';
	saveBtn.className = tw('btn-primary hidden');
	saveBtn.textContent = 'Сохранить';

	actions.appendChild(cancelBtn);
	actions.appendChild(saveBtn);
	form.appendChild(actions);

	function handleSave(): void {
		clearInputError(incomeInput);
		periodError.classList.add('hidden');

		const income = parseAmount(getInputValue(incomeInput));
		const endDate = periodSelect.getEndDate();

		let hasError = false;

		if (income < 0) {
			setInputError(incomeInput, 'Сумма не может быть отрицательной');
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
			initialBalance: budget.initialBalance,
			startDate: budget.startDate,
			endDate: endDate ? toISODate(endDate) : budget.endDate,
			createdAt: budget.createdAt,
		};

		if (income > 0) {
			const tx: Transaction = {
				id: makeTxId(),
				amount: income,
				date: new Date().toISOString(),
				type: 'income',
			};
			void addTransaction(tx).then(() => setBudget(updated));
		} else {
			void setBudget(updated);
		}
	}

	incomeInput.querySelector('input')?.addEventListener('input', () => {
		clearInputError(incomeInput);
	});

	form.addEventListener('submit', event => {
		event.preventDefault();
		handleSave();
	});

	card.appendChild(form);
	wrapper.appendChild(card);
	root.appendChild(wrapper);
}
