import plural from 'pluralize'

export const pluralize = (word) => word ? plural(word) : word
