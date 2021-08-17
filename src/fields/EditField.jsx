import React from 'react'
import PropTypes from 'prop-types'

const EditField = React.memo(({
  component,
  ...props
}) => {
  const Field = component
  return (
    <Field
      {...props}
    />
  )
})
// , (prev, next) => {
//   for (const key in prev) {
//     if (prev[key] !== next[key]) {
//       console.log('memo not equal', key, prev[key], next[key])
//       return false
//     }
//   }
//   return true
// })

EditField.propTypes = {
  component: PropTypes.func.isRequired
}

export {
  EditField
}

export default EditField
