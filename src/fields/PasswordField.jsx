import React, { useState } from 'react'
import PropTypes from 'prop-types'

import UITextField from '@mui/material/TextField'
import { EDIT_VIEW } from '../types'
import { ControllerPropTypes } from '../controller'

export const PasswordField = ({
  onChange,
  value,
  formType,
  error,
  helperText,
  required,
  onErrorStatusChange,
  parentController,
  fieldName,
  ...props
}) => {
  const [initialValue] = useState(value)
  const [modified, setModified] = useState(false)

  const handleChange = (value) => {
    if (value === '' && formType === EDIT_VIEW) {
      onChange(initialValue)
      setModified(false)
    } else {
      onChange(value)
      setModified(true)
    }
  }

  return (
    <UITextField
      onChange={(event) => handleChange(event.target.value)}
      value={!modified ? '' : value}
      required={formType !== EDIT_VIEW && required}
      error={modified && error}
      helperText={(modified && helperText) || null}
      placeholder={formType === EDIT_VIEW ? 'Inchangé' : null}
      {...props}
    />
  )
}

PasswordField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  fieldName: PropTypes.string,
  formType: PropTypes.string.isRequired,
  error: PropTypes.bool,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

PasswordField.defaultProps = {
  error: false,
  value: null,
  required: false,
  helperText: null,
  onErrorStatusChange: null,
  parentController: null,
  fieldName: null
}
export default PasswordField
