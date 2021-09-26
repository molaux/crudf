import React, { useState, useMemo, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'fast-deep-equal/es6/react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import CircularProgress from '@mui/material/CircularProgress'
import { Grid } from '@mui/material'

import { StatusTooltip, Center } from '@molaux/mui-utils'
import { Form } from './Form'
import { inferErrorsFactory } from './inferForm'
import { CREATE_VIEW } from './types'

import { toInput } from './inferInput'
import { useType, TypePropTypes } from './graphql'
import { useController, ControllerPropTypes } from './controller'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'

export const Create = ({
  controller,
  onChange,
  onClose,
  classes,
  translations,
  layout,
  label,
  onErrorStatusChange
}) => {
  const hideList = layout?.hide || []
  const [isModified, setIsModified] = useState(false)
  const [mutationError, setMutationError] = useState(false)
  const [localValue, _setLocalValue] = useState(
    Object
      .keys(controller.create.defaultValue)
      .filter((key) => hideList.indexOf(key) === -1)
      .reduce((o, key) => ({
        ...o,
        [key]: controller.create.defaultValue[key]
      }), {})
  )

  const setLocalValue = useCallback((reducer) => {
    _setLocalValue(reducer)
    setIsModified(true)
  }, [_setLocalValue])

  useEffect(() => {
    if (isModified) {
      onChange?.(toInput(
        controller.type,
        localValue
      ))
    }
  }, [localValue, isModified])

  const [delegatedErrors, _setDelegatedErrors] = useState({})
  const setDelegatedErrors = useCallback((fieldName, error) => {
    if (delegatedErrors[fieldName] !== error) {
      _setDelegatedErrors((last) => ({
        [fieldName]: error
      }))
    }
  }, [_setDelegatedErrors])

  const [errors, setErrors] = useState(
    Object.keys(localValue).reduce((o, key) => ({ ...o, [key]: false }), {})
  )

  const handleSave = async () => {
    const input = toInput(
      controller.type,
      localValue
    )
    try {
      await controller.create.save(input)
      setMutationError(false)
      onClose?.()
    } catch (error) {
      setMutationError(error)
    }
  }

  const inferErrors = useMemo(
    () => Array.from(controller.type.fields.values())
      .filter(({ name }) => hideList.indexOf(name) === -1)
      .reduce((register, field) => ({
        ...register,
        [field.name]: inferErrorsFactory(controller.type)(field.name)
      }), {}),
    [controller]
  )

  const hasErrors = useCallback((errors) => Object
    .values(errors)
    .reduce(
      (error, fieldError) => error || !!fieldError,
      false
    ), [])

  useEffect(() => {
    const lastErrors = errors
    const newErrors = controller.type
      ? Array.from(controller.type.fields.values())
        .filter(({ name }) => hideList.indexOf(name) === -1)
        .reduce((register, field) => ({
          ...register,
          [field.name]: inferErrors[field.name](localValue[field.name]) ||
            !!delegatedErrors[field.name]
        }), {})
      : null

    if (!isEqual(lastErrors, newErrors)) {
      if (onErrorStatusChange && hasErrors(lastErrors) !== hasErrors(newErrors)) {
        onErrorStatusChange(hasErrors(newErrors))
      }
      setErrors(newErrors)
    }
  }, [controller, localValue, inferErrors, delegatedErrors])

  const title = `${controller.type.name} creation`
  return (
    <Grid container direction="column" {...onChange ? {} : { classes: { root: classes.halfWidth } }}>
      <Grid item>
        <Typography sx={{ fontWeight: 400 }} gutterBottom variant={onChange ? 'h6' : 'h5'}>{label || translations?.type?.[title] || title}</Typography>
      </Grid>
      <Grid classes={onChange ? { root: classes.innerForm } : {}} item>
        <Form
          value={localValue}
          errors={errors}
          onChange={setLocalValue}
          variant="standard"
          type={controller.type}
          classes={classes}
          translations={translations}
          layout={layout}
          formType={CREATE_VIEW}
          onErrorStatusChange={setDelegatedErrors}
          disabled={controller.create.loading}
        />
      </Grid>
      {!onChange
        ? (
          <Grid item>
            <Box
              sx={{
                marginTop: '24px',
                '& > :not(style)': { m: 1 }
              }}
            >
              <Button
                color="primary"
                onClick={() => onClose?.()}
                startIcon={<CancelIcon />}
                variant="outlined"
              >
                Annuler
              </Button>
              <StatusTooltip
                onClose={() => setMutationError(false)}
                open={!!mutationError}
                title="Une erreur est survenue lors de l'enregistrement"
                content={mutationError?.message?.substr(0, 300) || ''}
                error
              >
                <Button
                  color={mutationError ? 'error' : 'primary'}
                  onClick={() => handleSave()}
                  startIcon={<SaveIcon />}
                  variant="contained"
                  disabled={hasErrors(errors) || controller.create.loading}
                >
                  Enregistrer
                </Button>
              </StatusTooltip>
            </Box>
          </Grid>
          )
        : null}
    </Grid>
  )
}

Create.propTypes = {
  classes: PropTypes.shape({
    innerForm: PropTypes.string,
    halfWidth: PropTypes.string
  }),
  onClose: PropTypes.func,
  translations: TranslationsPropTypes,
  layout: Form.propTypes.layout,
  controller: ControllerPropTypes.isRequired,
  value: PropTypes.shape({}),
  onChange: PropTypes.func,
  label: PropTypes.string,
  onErrorStatusChange: PropTypes.func
}

Create.defaultProps = {
  onClose: null,
  classes: null,
  value: null,
  translations: TranslationsDefaultProps,
  layout: Form.defaultProps.layout,
  onChange: null,
  label: null,
  onErrorStatusChange: null
}

export const CreateTypeForm = ({ typeName, ...builderProps }) => (props) => {
  const { type } = useType(typeName)
  return type
    ? <TypedCreate type={type} {...props} {...builderProps} />
    : <Center><CircularProgress color="secondary" /></Center>
}

CreateTypeForm.propTypes = {
  typeName: PropTypes.string.isRequired,
  translations: Create.propTypes.translations,
  layout: Create.propTypes.layout
}

CreateTypeForm.defaultProps = {
  translations: Create.defaultProps.translations,
  layout: Create.defaultProps.layout
}

const TypedCreate = ({ type, ...props }) => {
  const controller = useController(type, { queryVariables: {} })
  return <Create controller={controller} {...props} />
}

TypedCreate.propTypes = {
  type: TypePropTypes.isRequired
}

export default Create
