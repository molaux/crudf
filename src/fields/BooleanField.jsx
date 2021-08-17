import React from 'react'
import PropTypes from 'prop-types'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import { ControllerPropTypes } from '../controller'

export const BooleanField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  fieldName,
  formType,
  onErrorStatusChange,
  parentController,
  fullWidth,
  ...props
}) => (
  <FormControlLabel
    control={(
      <Checkbox
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        {...props}
      />
    )}
    label={label}
  />
)

BooleanField.propTypes = {
  label: PropTypes.string,
  fieldName: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes,
  fullWidth: PropTypes.bool
}

BooleanField.defaultProps = {
  label: null,
  value: null,
  error: null,
  helperText: null,
  fieldName: null,
  formType: null,
  onErrorStatusChange: null,
  parentController: null,
  fullWidth: false
}

export default BooleanField
