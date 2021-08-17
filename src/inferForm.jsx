import { DateField } from './fields/DateField'
import { TextField } from './fields/TextField'
import { BooleanField } from './fields/BooleanField'
import { PasswordField } from './fields/PasswordField'
import { ObjectSelectorFieldBuilder } from './fields/ObjectSelectorField'

import {
  isObject,
  isList,
  isMandatory,
  isDate,
  isBoolean,
  isPassword
  // isPhone
} from './inferTypes'

import { getFinalType } from './graphql'

export const isEmpty = (type, value) => {
  if (isBoolean({ type })) {
    return value !== true && value !== false
  }
  return !value
}

export const inferFormFactory = (type, classes, layout) => (fieldName) => {
  const field = type.fields.get(fieldName)

  if (isObject(field)) {
    if (layout?.components && Object.keys(layout.components).includes(fieldName)) {
      return layout.components[fieldName]
    }
    return ObjectSelectorFieldBuilder(field, classes)
  }

  if (isList(field)) {
    return (props) => 'LIST'
  }

  if (isDate(field)) {
    return DateField
  }

  if (isBoolean(field)) {
    return BooleanField
  }

  if (isPassword(field)) {
    return PasswordField
  }

  // if (isPhone(field)) {
  //   return (props) => <MuiPhoneNumber defaultCountry={'fr'} {...props} />
  // }

  return TextField
}

export const inferErrorsFactory = (type) => (fieldName) => {
  const field = type.fields.get(fieldName)
  const finalFieldType = getFinalType(field.inputType)

  let error = () => false

  if (isMandatory(field.inputType)) {
    error = (value) => (isEmpty(finalFieldType, value) ? 'Ce champ est requis' : false)
  }

  if (finalFieldType.validator) {
    error = (value) => {
      if (!isMandatory(field.inputType) && isEmpty(finalFieldType, value)) {
        return false
      }

      if (finalFieldType.validator.is) {
        if (!(new RegExp(finalFieldType.validator.is.args)).test(value)) {
          return finalFieldType.validator.is.msg
        }
      }

      if (finalFieldType.validator.len) {
        if ((value || '').length < finalFieldType.validator.len.args[0] ||
          (value || '').length > finalFieldType.validator.len.args[1]) {
          return finalFieldType.validator.len.msg
        }
      }
      return false
    }
  }

  if (isList(field)) {
    return (values) => values.reduce((first, value) => first || error(value), false)
  }
  return error
}
