import { expect, test } from '@oclif/test'

describe('create', () => {
	test
		.stdout()
		.command(['create', '--from=oclif'])
		.it('runs create cmd', ctx => {
			expect(ctx.stdout).to.contain('hello friend from oclif!')
		})
})
