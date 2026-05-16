import { tw } from '../utils/tw';

export interface InputOptions {
	id?: string;
	label?: string;
	placeholder?: string;
	value?: string;
	inputMode?: 'numeric' | 'decimal' | 'text';
	type?: 'text' | 'number';
	onInput?: (value: string) => void;
	onEnter?: () => void;
	ariaLabel?: string;
}

export function createInput(options: InputOptions = {}): HTMLLabelElement {
	const wrapper = document.createElement('label');
	wrapper.className = tw('block');

	if (options.label) {
		const labelEl = document.createElement('span');
		labelEl.className = tw('input-label');
		labelEl.textContent = options.label;
		wrapper.appendChild(labelEl);
	}

	const input = document.createElement('input');
	input.className = tw('input-field');
	input.type = options.type ?? 'text';
	if (options.id) {
		input.id = options.id;
	}
	if (options.placeholder) {
		input.placeholder = options.placeholder;
	}
	if (options.value !== undefined) {
		input.value = options.value;
	}
	if (options.inputMode) {
		input.inputMode = options.inputMode;
	}
	if (options.ariaLabel) {
		input.setAttribute('aria-label', options.ariaLabel);
	}

	if (options.inputMode === 'decimal' || options.inputMode === 'numeric') {
		input.addEventListener('beforeinput', (e: InputEvent) => {
			if (!e.data) {
				return;
			}
			const allowed = options.inputMode === 'decimal' ? /^[\d.,]$/ : /^\d$/;
			if (!allowed.test(e.data)) {
				e.preventDefault();
			}
		});
	}

	if (options.onInput) {
		input.addEventListener('input', () => {
			options.onInput?.(input.value);
		});
	}

	if (options.onEnter) {
		input.addEventListener('keydown', event => {
			if (event.key === 'Enter') {
				event.preventDefault();
				options.onEnter?.();
			}
		});
	}

	wrapper.appendChild(input);
	return wrapper;
}

export function getInputValue(labelEl: HTMLLabelElement): string {
	const input = labelEl.querySelector('input');
	return input?.value ?? '';
}

export function setInputValue(labelEl: HTMLLabelElement, value: string): void {
	const input = labelEl.querySelector('input');
	if (input) {
		input.value = value;
	}
}

export function focusInput(labelEl: HTMLLabelElement): void {
	const input = labelEl.querySelector('input');
	input?.focus();
}

export function setInputError(labelEl: HTMLLabelElement, message: string): void {
	const input = labelEl.querySelector('input');
	if (input) {
		input.style.borderColor = 'var(--color-error)';
		input.style.boxShadow = '0 0 0 2px rgb(239 68 68 / 0.15)';
	}
	let errorEl = labelEl.querySelector<HTMLElement>('.input-error-msg');
	if (!errorEl) {
		errorEl = document.createElement('span');
		errorEl.className = tw('input-error-msg mt-1 block text-sm');
		errorEl.style.color = 'var(--color-error)';
		labelEl.appendChild(errorEl);
	}
	errorEl.textContent = message;
}

export function clearInputError(labelEl: HTMLLabelElement): void {
	const input = labelEl.querySelector('input');
	if (input) {
		input.style.borderColor = '';
		input.style.boxShadow = '';
	}
	labelEl.querySelector('.input-error-msg')?.remove();
}
