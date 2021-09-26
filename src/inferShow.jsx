import React from 'react'
import Button from '@mui/material/Button'
import PhoneIcon from '@mui/icons-material/Phone'
import MailIcon from '@mui/icons-material/Email'
import { BooleanIcon } from '@molaux/mui-utils'

import { SHOW_VIEW } from './types'

import {
  isObject,
  isList,
  isDate,
  isBoolean,
  isPhone,
  isEmail,
  isPassword
} from './inferTypes'

import { getFinalType } from './graphql'
import { toInputIDs } from './inferInput'

export const inferShowFactory = (type, classes, layout, handles) => (fieldName, forceSingle) => {
  const field = type?.fields.get(fieldName) || fieldName
  const finalFieldType = getFinalType(field.type)

  let serializer = (value) => value
  if (isObject(field)) {
    if (layout?.components && Object.keys(layout.components).includes(fieldName)) {
      return (value) => value
    }
    serializer = (value) => {
      const ids = toInputIDs(finalFieldType)(value)
      const idsStr = Object.values(ids).join(',')
      // eslint-disable-next-line react/destructuring-assignment
      const text = value.name || `[${idsStr}]`
      return (handles?.[finalFieldType.name]
        ? (
          <Button
            key={idsStr}
            onClick={() => handles[finalFieldType.name](SHOW_VIEW, ids)}
            classes={{ root: classes.linkTo }}
          >
            {text}
          </Button>
          )
        : text)
    }
  } else if (isDate(field)) {
    serializer = (value) => value.toLocaleString()
  } else if (isBoolean(field)) {
    serializer = (value) => <BooleanIcon state={value} />
  } else if (isPassword(field)) {
    serializer = () => '******'
  } else if (isPhone(field)) {
    serializer = (value) => (value
      ? <Button href={`tel:${value}`} size="small" startIcon={<PhoneIcon />} classes={{ root: classes.linkTo }}>{value}</Button>
      : null)
  } else if (isEmail(field)) {
    serializer = (value) => (value
      ? <Button href={`mailto:${value}`} size="small" startIcon={<MailIcon />} classes={{ root: classes.linkTo }}>{value}</Button>
      : null)
  }

  if (!forceSingle && isList(field)) {
    return (values) => (layout?.layout?.[fieldName]?.maxLength &&
      values.length > layout?.layout?.[fieldName]?.maxLength
      ? values.slice(0, layout?.layout?.[fieldName]?.maxLength)
        .map(serializer)
        .reduce((r, a) => r.concat(a, ', '), [])
        .slice(0, -1)
        .concat(['...'])
      : values.map(serializer)
        .reduce((r, a) => r.concat(a, ', '), [])
        .slice(0, -1)
    )
  }
  return serializer
}

export default inferShowFactory
