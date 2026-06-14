import { runCommand } from '@oclif/test';
import { expect } from 'chai';

describe('create', () => {
	it('fails without a name argument', async () => {
		const { error } = await runCommand(['create']);
		expect(error?.message).to.contain('Missing 1 required arg');
	});

	it('rejects an invalid --type flag', async () => {
		const { error } = await runCommand(['create', 'SwupExamplePlugin', '--type=widget']);
		expect(error?.message).to.contain('Expected --type=widget to be one of');
	});
});
