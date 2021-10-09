import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import UITextField from '@mui/material/TextField'

import { ControllerPropTypes } from '../controller'

const useIntFieldStyles = makeStyles((theme) => ({
  input: {
    '&[type=number]': {
      '-moz-appearance': 'textfield'
    },
    '&::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none'
    },
    '&::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none'
    }
  }
}))

export const FloatField = ({
  onChange,
  fieldName,
  formType,
  value,
  onErrorStatusChange,
  parentController,
  ...props
}) => {
  const fieldClasses = useIntFieldStyles()

  return (
    <UITextField
      value={`${value}` || ''}
      onChange={(event) => onChange(event.target.value)}
      {...props}
      InputProps={{
        classes: fieldClasses,
        inputMode: 'numeric',
        pattern: '[0-9]*(\\.[0-9]+)?' 
      }}
    />
    )
}

FloatField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

FloatField.defaultProps = {
  fieldName: null,
  formType: null,
  value: '',
  onErrorStatusChange: null,
  parentController: null
}

export default FloatField
