# Калькулятор расходов

**Автор:** Старостин Леонид, 1 курс магистратура

**Репозиторий:** [https://github.com/StarostinLF/higher-web-practice-calculator](https://github.com/StarostinLF/higher-web-practice-calculator)

Калькулятор расходов — SPA для управления ежедневным бюджетом. Пользователь задаёт стартовый баланс и срок, а приложение рассчитывает дневной лимит, отслеживает траты и хранит историю транзакций в IndexedDB.

## Стек

- HTML, CSS, TypeScript
- Vite
- Tailwind CSS
- IndexedDB
- Zod
- date-fns

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Сборка для продакшена

```bash
npm run build
npm run preview
```

## Проверки

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run validate     # type-check + lint + prettier
```

## Структура

```
src/
├── App.ts                       # роутер
├── main.ts                      # точка входа
├── styles.css                   # Tailwind + дизайн-токены
├── models/schemas.ts            # Zod-схемы и типы
├── services/budget-calculator.ts # расчёт метрик
├── components/                  # переиспользуемые UI
│   ├── input.ts
│   ├── date-input.ts            # календарь
│   └── period-select.ts         # дропдаун со сроком
├── pages/                       # страницы
│   ├── start-page.ts
│   ├── main-page.ts
│   └── history-page.ts
└── utils/
    ├── db.ts                    # IndexedDB
    ├── state.ts                 # state manager
    ├── format.ts                # форматирование денег и дат
    └── validation.ts            # обёртка над Zod
```
