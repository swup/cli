import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const bin = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'run.js');

async function cli(...args: string[]): Promise<string> {
	try {
		const { stdout, stderr } = await execFileAsync(process.execPath, [bin, ...args]);
		return stdout + stderr;
	} catch (error) {
		const e = error as { stdout?: string; stderr?: string };
		return (e.stdout ?? '') + (e.stderr ?? '');
	}
}

describe('cli output', () => {
	it('prints the version', async () => {
		expect(await cli('--version')).toContain('@swup/cli/');
	});

	it('prints help', async () => {
		const out = await cli('--help');
		expect(out).toContain('USAGE');
		expect(out).toContain('package');
	});
});
