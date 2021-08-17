import { isObject, isList, isDate, isBoolean, isString } from './inferTypes'
import { getFinalType } from './graphql'

export const toInputIDs = (finalType) => (o) => finalType.ids
  .reduce((input, fieldName) => ({ ...input, [fieldName]: o[fieldName] }), {})

export const toInputIDsOrAsIs = (finalType) => (o) => (finalType.ids
  .reduce((ok, id) => id in o && ok, true)
  ? toInputIDs(finalType)(o)
  : o)

export const toInput = (type, o, isCreate) => Object.keys(o).reduce((input, fieldName) => {
  const field = type.fields.get(fieldName)
  const fieldType = field.type
  const finalType = getFinalType(fieldType)
  const typeToInputIDsOrAsIs = toInputIDsOrAsIs(finalType)
  if (isObject(field)) {
    input[fieldName] = isList(field)
      ? o[fieldName]?.map(typeToInputIDsOrAsIs)
      : typeToInputIDsOrAsIs(o[fieldName])
  } else if (isDate(field)) {
    input[fieldName] = o[fieldName]?.toISOString()
  } else {
    input[fieldName] = o[fieldName]
  }
  return input
}, {})

export const shape = (type) => (o) => Object
  .keys(o)
  .filter((key) => type.fields.has(key))
  .reduce((v, key) => ({ ...v, [key]: o[key] }), {})

export const defaultEntity = (type) => Array
  .from(type.fields.values())
  .reduce((entity, field) => (type.ids.includes(field.name)
    ? entity
    : ({
        ...entity,
        [field.name]:
          isList(field)
            ? []
            : isBoolean(field)
              ? false
              : isString(field)
                ? ''
                : null
      })), {})
