import styles from './index.css?inline';

export default class SwupTestPlugin {
	name = 'SwupTestPlugin';
	styles = styles;

	getStyles(): string {
		return this.styles;
	}
}
