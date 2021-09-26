import React from 'react'
import PropTypes from 'prop-types'

import UITextField from '@mui/material/TextField'
import { ControllerPropTypes } from '../controller'

export const TextField = ({
  onChange,
  fieldName,
  formType,
  value,
  onErrorStatusChange,
  parentController,
  ...props
}) => (
  <UITextField
    value={value || ''}
    onChange={(event) => onChange(event.target.value)}
    {...props}
  />
)

TextField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

TextField.defaultProps = {
  fieldName: null,
  formType: null,
  value: '',
  onErrorStatusChange: null,
  parentController: null
}

export default TextField
