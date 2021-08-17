import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { BooleanField } from './BooleanField'
import { DateField } from './DateField'
import { TextField } from './TextField'
import { ObjectSelectorField } from './ObjectSelectorField'
import { PasswordField } from './PasswordField'

const CreateField = React.memo(({
  onChange,
  value,
  component,
  error,
  helperText,
  required,
  ...props
}) => {
  const [modified, setModified] = useState(false)

  const handleChange = (value) => {
    onChange(value)
    setModified(true)
  }
  const Field = component
  return (
    <Field
      onChange={(value) => handleChange(value)}
      value={value}
      required={required}
      error={modified && error}
      helperText={(modified && helperText) || null}
      {...props}
    />
  )
})
//, (prev, next) => {
//   for (const key in prev) {
//     if (prev[key] !== next[key]) {
//       console.log('memo not equal', key, prev[key], next[key])
//       return false
//     }
//   }
//   return true
// })

CreateField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    BooleanField.propTypes.value,
    DateField.propTypes.value,
    ObjectSelectorField.propTypes.value,
    PasswordField.propTypes.value,
    TextField.propTypes.value
  ]),
  component: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool
}

CreateField.defaultProps = {
  value: null,
  error: false,
  helperText: null,
  required: false
}

export {
  CreateField
}

export default CreateField
