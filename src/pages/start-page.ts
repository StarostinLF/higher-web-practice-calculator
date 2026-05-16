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
import { tw } from '../utils/tw';
import { parseAmount, validate } from '../utils/validation';

function setPeriodError(triggerEl: HTMLElement, message: string): void {
	triggerEl.style.borderColor = 'var(--color-error)';
	triggerEl.style.boxShadow = '0 0 0 2px rgb(239 68 68 / 0.15)';
	let errorEl = triggerEl.parentElement?.querySelector<HTMLElement>('.period-error-msg');
	if (!errorEl) {
		errorEl = document.createElement('span');
		errorEl.className = tw('period-error-msg mt-1 block text-sm');
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
	wrapper.className = tw(
		'flex flex-1 items-start justify-center px-4 py-8 pb-20 sm:items-center sm:pb-8',
	);

	const card = document.createElement('section');
	card.className = tw('w-full max-w-md');

	const heading = document.createElement('h1');
	heading.className = tw('h1 mb-5');
	heading.textContent = 'Начнём!';
	card.appendChild(heading);

	const form = document.createElement('form');
	form.className = tw('flex flex-col gap-4');
	form.noValidate = true;

	const balanceInput = createInput({
		label: 'Укажите баланс',
		placeholder: 'Стартовый баланс',
		inputMode: 'decimal',
		ariaLabel: 'Стартовый баланс',
	});
	form.appendChild(balanceInput);

	const periodSelect = createPeriodSelect({
		label: 'На срок',
		onChange: () => updateSubmitVisibility(),
	});
	form.appendChild(periodSelect.element);

	const periodTrigger = periodSelect.element.querySelector<HTMLElement>('button');

	const actionBar = document.createElement('div');
	actionBar.className = tw(
		'fixed inset-x-0 bottom-0 bg-surface px-4 pt-3 pb-4 sm:static sm:mt-2 sm:bg-transparent sm:p-0',
	);

	const submitBtn = document.createElement('button');
	submitBtn.type = 'submit';
	submitBtn.className = tw('btn-primary hidden');
	submitBtn.textContent = 'Рассчитать';
	actionBar.appendChild(submitBtn);
	form.appendChild(actionBar);

	card.appendChild(form);
	wrapper.appendChild(card);
	root.appendChild(wrapper);

	focusInput(balanceInput);

	function updateSubmitVisibility(): void {
		const hasBalance = getInputValue(balanceInput).trim() !== '';
		const hasDate = periodSelect.getEndDate() !== null;
		submitBtn.classList.toggle('hidden', !(hasBalance && hasDate));
	}

	balanceInput.querySelector('input')?.addEventListener('input', () => {
		clearInputError(balanceInput);
		updateSubmitVisibility();
	});

	form.addEventListener('submit', event => {
		event.preventDefault();
		clearInputError(balanceInput);
		if (periodTrigger) {
			clearPeriodError(periodTrigger);
		}

		const initialBalance = parseAmount(getInputValue(balanceInput));
		const endDate = periodSelect.getEndDate();

		const today = startOfDay(new Date());
		const payload = {
			initialBalance,
			startDate: toISODate(today),
			endDate: endDate ? toISODate(endDate) : '',
		};

		const result = validate(BudgetInputSchema, payload);
		if (!result.success || !result.data) {
			if (result.errors?.initialBalance) {
				setInputError(balanceInput, result.errors.initialBalance);
			}
			if (result.errors?.endDate && periodTrigger) {
				setPeriodError(periodTrigger, result.errors.endDate);
			}
			return;
		}

		void setBudget({ id: 'current', createdAt: toISODate(today), ...result.data });
	});
}
