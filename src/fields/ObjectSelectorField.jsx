import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import FormHelperText from '@mui/material/FormHelperText'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { Center } from '@molaux/mui-utils'

import { useController, ControllerPropTypes } from '../controller'
import { useType, getFinalType, TypePropTypes, FieldPropTypes } from '../graphql'
import { isList } from '../inferTypes'

import { inferShowFactory } from '../inferShow'
import { shape } from '../inferInput'

const useStyles = makeStyles({
  root: {
    minWidth: 120
  }
})

export const SelectorSummary = (serializer, value) => () => {
  if (!Array.isArray(value)) {
    return null
  }
  const maxLength = 3
  const displayValue = value.length > maxLength
    ? [...value.slice(0, maxLength).map(serializer), '...']
    : value.map(serializer)

  return <Typography sx={{ whiteSpace: 'normal' }}>{displayValue.join(', ')}</Typography>
}

export const ObjectSelectorField = ({
  field,
  serializer,
  type,
  classes,
  onChange,
  value,
  label,
  required,
  helperText,
  multiple,
  fieldName,
  formType,
  variant,
  onErrorStatusChange,
  parentController,
  ...props
}) => {
  const controller = useController(type, { queryVariables: {} })
  const idKey = type.ids[0]
  useEffect(() => {
    controller.query.use()
  }, [controller])
  const handleChange = (value) => {
    if (!controller.query.data) {
      return
    }

    if (multiple) {
      onChange(
        (value || [])
          .map((id) => controller.query.data.find((o) => o[idKey] === id))
          .map(shape(getFinalType(field.type)))
      )
    } else {
      onChange(
        shape(getFinalType(field.type))(controller.query.data.find((o) => o[idKey] === value))
      )
    }
  }

  return (
    <FormControl variant={variant} required={required} fullWidth>
      <InputLabel id="object-selector">{label}</InputLabel>
      <Select
        labelId="object-selector"
        value={multiple ? value.map((v) => v[idKey]) : value?.[idKey]}
        onChange={(event) => handleChange(event.target.value)}
        renderValue={SelectorSummary(serializer, value)}
        multiple={multiple}
        MenuProps={{ disableScrollLock: true }}
        {...props}
      >
        {(controller.query.data || [])
          .map((o) => <MenuItem key={o?.[idKey]} value={o?.[idKey]}>{serializer(o)}</MenuItem>)}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}

ObjectSelectorField.propTypes = {
  onChange: PropTypes.func.isRequired,
  field: FieldPropTypes.isRequired,
  serializer: PropTypes.func.isRequired,
  type: TypePropTypes.isRequired,
  classes: PropTypes.shape({}).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.arrayOf(PropTypes.shape({}))
  ]),
  label: PropTypes.string,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  multiple: PropTypes.bool,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes,
  variant: PropTypes.string
}

ObjectSelectorField.defaultProps = {
  label: null,
  value: null,
  required: false,
  helperText: null,
  multiple: false,
  fieldName: null,
  formType: null,
  onErrorStatusChange: null,
  parentController: null,
  variant: null
}

export const ObjectSelectorFieldBuilder = (field) => (props) => {
  const classes = useStyles()
  const isMultiple = useMemo(() => isList(field), [field])
  const { type } = useType(getFinalType(field.type).name)
  const serializer = useMemo(() => inferShowFactory(null, classes)(field, true))

  return (
    <div className={classes.root}>
      {type
        ? (
          <ObjectSelectorField
            field={field}
            type={type}
            multiple={isMultiple}
            serializer={serializer}
            classes={classes}
            {...props}
          />
          )
        : <Center><CircularProgress color="secondary" /></Center>}
    </div>
  )
}

export default ObjectSelectorFieldBuilder
