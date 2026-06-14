import { runCommand } from '@oclif/test';
import { describe, expect, it } from 'vitest';

describe('create', () => {
	it('fails without a name argument', async () => {
		const { error } = await runCommand(['create']);
		expect(error?.message).toContain('Missing 1 required arg');
	});

	it('rejects an invalid --type flag', async () => {
		const { error } = await runCommand(['create', 'SwupExamplePlugin', '--type=widget']);
		expect(error?.message).toContain('Expected --type=widget to be one of');
	});
});
