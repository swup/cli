import { exec } from 'child_process'

export function cloneRepo(repoUrl: string, destination: string): Promise<void> {
	return new Promise((resolve, reject) => {
		exec(`git clone ${repoUrl} ${destination}`, (error, stdout, stderr) => {
			if (error) {
				return reject(new Error(`Failed to clone repo. Error: ${error.message}. Stderr: ${stderr}`))
			}
			resolve()
		})
	})
}
