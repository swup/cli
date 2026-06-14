import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig(
	{
		ignores: ['dist/', 'node_modules/', 'test/', 'bin/', '**/*.cjs', '**/*.js']
	},
	eslint.configs.recommended,
	tseslint.configs.recommended,
	prettierRecommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ vars: 'all', args: 'none', caughtErrors: 'none' }
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
			// This CLI deliberately formats caught errors into human-readable messages.
			'preserve-caught-error': 'off'
		}
	}
);
