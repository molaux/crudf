import React from 'react'
import PropTypes from 'prop-types'

import TextField from '@material-ui/core/TextField'

import { LocalizationProvider, DateTimePicker } from '@material-ui/lab'
import DateFnsUtils from '@date-io/date-fns'
import fr from 'date-fns/locale/fr'

import { ControllerPropTypes } from '../controller'

export const DateField = ({
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
    <DateTimePicker
      renderInput={(props) => <TextField {...props} {...extraProps} />}
      value={value}
      onChange={onChange}
      label={label}
    />
  </LocalizationProvider>
)

DateField.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

DateField.defaultProps = {
  value: null,
  fieldName: null,
  formType: null,
  onErrorStatusChange: null,
  parentController: null
}

export default DateField
