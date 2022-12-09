import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from 'tss-react/mui'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import FormHelperText from '@mui/material/FormHelperText'

import { ControllerPropTypes } from '../controller'

const useStyles = makeStyles()({
  root: {
    minWidth: 120
  }
})

export const EnumSelectorField = ({
  onChange,
  fieldName,
  formType,
  value,
  variant,
  required,
  helperText,
  label,
  onErrorStatusChange,
  parentController,
  translations,
  enums,
  ...props
}) => {
  const serializer = useCallback((value) => translations?.[value] ?? value, [translations])
  return (
    <FormControl variant={variant} required={required} fullWidth>
      <InputLabel id="object-selector">{label}</InputLabel>
      <Select
        labelId="enum-selector"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        renderValue={serializer}
        multiple={false}
        MenuProps={{ disableScrollLock: true }}
        {...props}
      >
        {(enums || [])
            .map((e) => <MenuItem key={e} value={e}>{serializer(e)}</MenuItem>)}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}

EnumSelectorField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  fieldName: PropTypes.string,
  formType: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  parentController: ControllerPropTypes
}

EnumSelectorField.defaultProps = {
  fieldName: null,
  formType: null,
  value: '',
  onErrorStatusChange: null,
  parentController: null
}

export const EnumSelectorFieldBuilder = (field, translations) => (props) => (
  <EnumSelectorField
    translations={translations}
    enums={field?.inputType?.type?.enumValues?.map(({ name }) => name)}
    {...props}
  />
)
