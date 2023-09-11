import { camelCase, upperFirst } from 'lodash'

export function pascalCase(str: string): string {
  return upperFirst(camelCase(str))
}
