import live from 'shelljs-live';

export function exec(command: string | string[]) {
	const status = live(command);
	if (status && status >= 0) {
		// Exit with the child's status code, so failing builds fail CI
		// eslint-disable-next-line no-process-exit, unicorn/no-process-exit
		process.exit(status);
	}

	return status;
}
