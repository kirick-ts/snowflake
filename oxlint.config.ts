import { plugins, rules } from '@kirick/lint/oxlint';
import { defineConfig } from 'oxlint';

export default defineConfig({
	plugins,
	rules,
	ignorePatterns: ['dist'],
});
