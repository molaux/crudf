import React, { useState, useMemo, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { klona } from 'klona/lite'
import isEqual from 'fast-deep-equal/es6/react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import CircularProgress from '@mui/material/CircularProgress'
import { Grid } from '@mui/material'

import { StatusTooltip, Center } from '@molaux/mui-utils'
import { Form } from './Form'
import { inferErrorsFactory } from './inferForm'
import { EDIT_VIEW } from './types'

import { diff } from './inferTypes'
import { toInputIDs } from './inferInput'
import { useType, TypePropTypes } from './graphql'
import { useController, ControllerPropTypes } from './controller'
import { Create } from './Create'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'

export const Edit = ({
  controller,
  value,
  onChange,
  onDelete,
  onClose,
  classes,
  translations,
  layout,
  label,
  onErrorStatusChange,
  disabled
}) => {
  const initialValue = useMemo(() => klona(value), [])
  const [localValue, _setLocalValue] = useState(klona(value))
  const [isModified, setIsModified] = useState(false)
  const [mutationError, setMutationError] = useState(false)

  const setLocalValue = useCallback((reducer) => {
    _setLocalValue(reducer)
    setIsModified(true)
  }, [_setLocalValue])

  useEffect(() => {
    if (isModified) {
      const oids = toInputIDs(controller.type)(localValue)
      onChange?.(({
        ...oids,
        ...getChanges(initialValue, localValue)
      }))
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

  const save = async (input) => {
    try {
      await controller.update.save(input, localValue)
      setMutationError(false)
    } catch (error) {
      setMutationError(error)
    }
  }

  const getChanges = (initialValue, localValue) => diff(initialValue, localValue)
    .reduce((input, fieldName) => ({
      ...input,
      [fieldName]: localValue[fieldName]
    }), {})

  const handleSave = () => {
    save(getChanges(initialValue, localValue))
  }

  const inferErrors = useMemo(
    () => Array.from(controller.type.fields.values()).reduce((register, field) => ({
      ...register,
      [field.name]: inferErrorsFactory(controller.type)(field.name)
    }), {}),
    [controller.type]
  )

  const hasErrors = useCallback((errors) => Object
    .values(errors)
    .reduce(
      (error, fieldError) => error || fieldError,
      false
    ), [])

  useEffect(() => {
    const lastErrors = errors
    const newErrors = controller.type
      ? Array.from(controller.type.fields.values()).reduce((register, field) => ({
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
  }, [controller.type, localValue, inferErrors, delegatedErrors])

  const hasOnlyValidChanges = () => diff(value, localValue)
    .reduce((valid, fieldName) => !errors[fieldName] && valid, true)

  const isDeleted = useCallback((entity) => controller.status.get(entity[controller.type.ids[0]]) === 'deleted', [controller])
  const title = `${controller.type.name} edition`
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
          formType={EDIT_VIEW}
          onErrorStatusChange={setDelegatedErrors}
          parentController={controller}
          disabled={disabled || isDeleted(initialValue) || controller.update.loading}
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
                onClick={() => onClose()}
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
                  disabled={disabled ||
                    isDeleted(initialValue) ||
                    controller.update.loading ||
                    diff(value, localValue).length === 0 || !hasOnlyValidChanges()}
                >
                  Enregistrer
                </Button>
              </StatusTooltip>
              <Button
                color="primary"
                onClick={() => onDelete(value)}
                startIcon={<DeleteIcon />}
                variant="contained"
                disabled={disabled || controller.update.loading || isDeleted(initialValue)}
              >
                Supprimer
              </Button>
            </Box>
          </Grid>
          )
        : null}
    </Grid>
  )
}

Edit.propTypes = {
  type: TypePropTypes,
  classes: PropTypes.shape({
    innerForm: PropTypes.string,
    halfWidth: PropTypes.string
  }),
  translations: TranslationsPropTypes,
  layout: Form.propTypes.layout,
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  controller: ControllerPropTypes.isRequired,
  value: PropTypes.shape({}).isRequired,
  onChange: PropTypes.func,
  label: PropTypes.string,
  onErrorStatusChange: PropTypes.func,
  disabled: PropTypes.bool
}

Edit.defaultProps = {
  type: null,
  classes: null,
  onClose: null,
  onDelete: null,
  onChange: null,
  translations: TranslationsDefaultProps,
  layout: Form.defaultProps.layout,
  label: null,
  onErrorStatusChange: null,
  disabled: false
}

export const TypedEdit = ({ type, parentController, value, fieldName, ...props }) => {
  const controller = useController(type, {
    queryVariables: { query: { where: { ...toInputIDs(type)(value) } } }
  })

  useEffect(() => {
    controller.query.use()
    if (parentController && fieldName) {
      parentController.registerSubController(fieldName, controller)
      return () => parentController.unregisterSubController(fieldName)
    }
    return null
  }, [])

  return controller.query.data
    ? controller.query.data.length
      ? (
        <Edit
          controller={controller}
          value={controller.query.data[0]}
          {...props}
        />
        )
      : <Create controller={controller} {...props} />
    : <Center><CircularProgress color="secondary" /></Center>
}

TypedEdit.propTypes = {
  type: TypePropTypes.isRequired,
  parentController: ControllerPropTypes,
  value: PropTypes.shape({}).isRequired,
  fieldName: PropTypes.string
}

TypedEdit.defaultProps = {
  parentController: null,
  fieldName: null
}

export const EditTypeForm = ({ typeName, translations, layout }) => (props) => {
  const { type } = useType(typeName)
  return type
    ? <TypedEdit type={type} {...props} translations={translations} layout={layout} />
    : <Center><CircularProgress color="secondary" /></Center>
}

EditTypeForm.propTypes = {
  typeName: PropTypes.string.isRequired,
  translations: Edit.propTypes.translations,
  layout: Edit.propTypes.layout
}

EditTypeForm.defaultProps = {
  translations: Edit.defaultProps.translations,
  layout: Edit.defaultProps.layout
}
