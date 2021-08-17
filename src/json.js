export const JSONReplacer = (key, value) => {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries())
    }
  }
  return value
}

export const JSONReviver = (value) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
  }
  return value
}

export const JSONWalk = (json, mapper) => mapper(
  Array.isArray(json)
    ? json.map((value) => JSONWalk(value, mapper))
    : typeof json === 'object' && json !== null
      ? Object.keys(json).reduce((walked, key) => ({
        ...walked,
        [key]: JSONWalk(json[key], mapper)
      }), {})
      : json
)
