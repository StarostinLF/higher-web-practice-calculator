import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
	maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
	return `${moneyFormatter.format(Math.round(value))} ₽`;
}

export function formatMoneyShort(value: number): string {
	return moneyFormatter.format(Math.round(value));
}

export function formatDate(isoDate: string): string {
	return format(parseISO(isoDate), 'd MMMM', { locale: ru });
}

export function makeTxId(): string {
	return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDaysLabel(days: number): string {
	const mod10 = days % 10;
	const mod100 = days % 100;
	if (mod10 === 1 && mod100 !== 11) {
		return `${days} день`;
	}
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
		return `${days} дня`;
	}
	return `${days} дней`;
}
