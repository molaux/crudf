import isEqual from 'fast-deep-equal/es6/react'
import { getFinalType } from './graphql'

export const isKind = (kind) => (type) => !!(type.kind === kind ||
  (type.ofType && isKind(kind)(type.ofType)))
export const isObject = (fieldOrType) => isKind('OBJECT')(fieldOrType.type || fieldOrType)
export const isList = (fieldOrType) => isKind('LIST')(fieldOrType.type || fieldOrType)
export const isMandatory = (fieldOrType) => isKind('NON_NULL')(fieldOrType.type || fieldOrType)
export const isScalar = (fieldOrType) => isKind('SCALAR')(fieldOrType.type || fieldOrType)

export const expected = (expectedName, expectedKind) => ({ type }) => (
  ({ name, kind }) => name === expectedName && kind === expectedKind)(getFinalType(type))

export const isID = expected('ID', 'SCALAR')
export const isDate = expected('Date', 'SCALAR')
export const isString = expected('String', 'SCALAR')
export const isBoolean = expected('Boolean', 'SCALAR')
export const isInt = expected('Int', 'SCALAR')
export const isFloat = expected('Float', 'SCALAR')

export const isPhone = (field) => isString(field) && field.name === 'phone'
export const isEmail = (field) => isString(field) && field.name === 'email'
export const isPassword = (field) => isString(field) && field.name === 'password'

export const isSortable = (fieldOrType) => !isObject(fieldOrType) || !isList(fieldOrType)

export const inferData = (type, data) => {
  if (Array.isArray(data)) {
    return data.map((row) => inferData(type, row))
  }
  for (const field of type.fields.values()) {
    if (data[field.name] === null) {
      continue
    } else if (isDate(field)) {
      data[field.name] = new Date(data[field.name])
    } else if (isObject(field)) {
      data[field.name] = inferData(getFinalType(field.type), data[field.name])
    }
  }
  // eslint-disable-next-line no-underscore-dangle
  delete data.__typename
  return data
}

export const diff = (a, b) => {
  const changes = []
  for (const key in a) {
    if (!(key in b)) {
      changes.push([key])
    }
    if (a[key] instanceof Date) {
      if (b[key] instanceof Date) {
        if (a[key].toISOString() !== b[key].toISOString()) {
          changes.push(key)
        }
      } else {
        changes.push(key)
      }
    } else if (!isEqual(a[key], b[key])) {
      changes.push([key])
    }
  }
  return changes
}
