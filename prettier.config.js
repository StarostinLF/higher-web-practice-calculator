/** @type {import('prettier').Config} */
export default {
	semi: true,
	trailingComma: 'all',
	singleQuote: true,
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	endOfLine: 'lf',
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'avoid',
	plugins: ['prettier-plugin-tailwindcss'],
	tailwindStylesheet: './src/styles.css',
	tailwindFunctions: ['tw'],
	overrides: [
		{
			files: '*.html',
			options: {
				parser: 'html',
			},
		},
		{
			files: '*.css',
			options: {
				parser: 'css',
			},
		},
		{
			files: '*.json',
			options: {
				parser: 'json',
			},
		},
	],
};
