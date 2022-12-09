import React from 'react'
import PropTypes from 'prop-types'

import TextField from '@mui/material/TextField'

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import DateFnsUtils from '@date-io/date-fns'
import fr from 'date-fns/locale/fr'

import { ControllerPropTypes } from '../controller'

export const DateOnlyField = ({
  label,
  value,
  onChange,
  fieldName,
  formType,
  onErrorStatusChange,
  parentController,
  ...extraProps
}) => (
  <LocalizationProvider dateAdapter={DateFnsUtils} locale={fr}>
    <DatePicker
      renderInput={(props) => <TextField {...props} {...extraProps} />}
      value={value}
      onChange={onChange}
      label={label}
    />
  </LocalizationProvider>
)

DateOnlyField.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

DateOnlyField.defaultProps = {
  value: null,
  fieldName: null,
  formType: null,
  onErrorStatusChange: null,
  parentController: null
}

export default DateOnlyField
