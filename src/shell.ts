import shell from 'shelljs';
import live from 'shelljs-live';

export function exec(command: string | string[]) {
	const status = live(command); // shell.exec(command)
	if (status && status >= 0) {
		shell.exit(status);
	}
	return status;
}
