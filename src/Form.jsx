import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { Grid } from '@mui/material'

import { inferFormFactory } from './inferForm'
import { isMandatory } from './inferTypes'
import { CREATE_VIEW } from './types'
import { CreateField } from './fields/CreateField'
import { EditField } from './fields/EditField'
import { TypePropTypes } from './graphql'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'
import { ControllerPropTypes } from './controller'

const FormRow = ({ fields }) => (
  <>
    {fields.map(([key, Field]) => (
      <Grid key={key} xs={12 / fields.length} item>
        {Field}
      </Grid>
    ))}
  </>
)

FormRow.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.node).isRequired
}

export const Form = ({
  value,
  onChange,
  type,
  classes,
  variant,
  translations,
  layout,
  errors,
  disabled,
  onErrorStatusChange,
  parentController,
  formType
}) => {
  const hideList = layout?.hide || []
  const userLayout = layout?.layout || []

  const inferForm = useMemo(() => (type
    ? Array.from(type.fields.values())
      .filter(({ name }) => hideList.indexOf(name) === -1)
      .reduce((register, field) => ({
        ...register,
        [field.name]: inferFormFactory(type, classes, layout)(field.name)
      }), {})
    : null),
  [type, layout?.hide])

  const rowsLayout = [
    ...userLayout.map((row) => row.map((fieldName) => type.fields.get(fieldName))),
    ...Array
      .from(type.fields.values())
      .filter(({ name }) => name in inferForm)
      .filter(({ name }) => !userLayout.find((row) => row.indexOf(name) !== -1))
      .map((field) => [field])
  ]

  const handles = useMemo(() => (rowsLayout.flat())
    .reduce(({ change, errorStatusChange }, field) => ({
      change: {
        ...change,
        [field.name]: (fieldValue) => onChange((value) => ({
          ...value,
          [field.name]: fieldValue
        }))
      },
      errorStatusChange: {
        ...errorStatusChange,
        [field.name]: (error) => onErrorStatusChange?.(field.name, error)
      }
    }), { change: {}, errorStatusChange: {} }), [/* onErrorStatusChange, onChange, rowsLayout */])

  return (
    <Grid container spacing={2}>
      {rowsLayout
        .map((fields) => (
          <Grid key={fields.map(({ name }) => name).join('-')} container item spacing={3}>
            <FormRow
              fields={fields.map((field) => {
                const Field = formType === CREATE_VIEW
                  ? CreateField
                  : EditField

                return [
                  field.name,
                  <Field
                    fullWidth
                    classes={classes}
                    error={errors?.[field.name] !== undefined && errors[field.name] !== false}
                    helperText={(errors?.[field.name]?.length && errors[field.name]) || null}
                    required={isMandatory(type.fields.get(field.name).inputType)}
                    label={translations?.fields?.[field.name] || field.name}
                    fieldName={field.name}
                    value={value[field.name]}
                    onChange={handles.change[field.name]}
                    variant={variant}
                    component={inferForm[field.name]}
                    formType={formType}
                    onErrorStatusChange={handles.errorStatusChange[field.name]}
                    parentController={parentController}
                    disabled={disabled}
                  />
                ]
              })}
            />
          </Grid>
        ))}
    </Grid>
  )
}

Form.propTypes = {
  type: TypePropTypes.isRequired,
  classes: PropTypes.shape({}),
  translations: TranslationsPropTypes,
  layout: PropTypes.shape({
    layout: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    hide: PropTypes.arrayOf(PropTypes.string),
    components: PropTypes.shape({})
  }),
  value: PropTypes.shape({}).isRequired,
  onChange: PropTypes.func.isRequired,
  onErrorStatusChange: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.string.isRequired,
  errors: PropTypes.shape({}).isRequired,
  parentController: ControllerPropTypes,
  formType: PropTypes.string.isRequired
}

Form.defaultProps = {
  translations: TranslationsDefaultProps,
  classes: null,
  disabled: false,
  parentController: null,
  layout: {
    layout: [[]],
    hide: [],
    components: {}
  },
  onErrorStatusChange: null
}

export default Form
