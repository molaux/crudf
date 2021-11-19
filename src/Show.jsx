import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import EditIcon from '@mui/icons-material/Edit'
import CancelIcon from '@mui/icons-material/Cancel'
import DeleteIcon from '@mui/icons-material/Delete'


import CircularProgress from '@mui/material/CircularProgress'
import { Grid } from '@mui/material'
import isEqual from 'fast-deep-equal'

import { Center } from '@molaux/mui-utils'

import { Form } from './Form'
import { toInputIDs } from './inferInput'
import { useType, TypePropTypes } from './graphql'
import { useController, ControllerPropTypes } from './controller'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'
import { inferShowFactory } from './inferShow'

const ShowRow = ({ fields }) => (
  <>
    {fields.map(([key, Field]) => (
      <Grid key={key} xs={12 / fields.length} item>
        {Field}
      </Grid>
    ))}
  </>
)

ShowRow.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.node).isRequired
}

const ShowField = ({ label, value }) => (
  <>
    <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>{label}</Typography>
    <Typography variant="body1" component="div" sx={{ fontWeight: 300 }}>{value !== null && value !== undefined && value !== '' ? value : '-'}</Typography>
  </>
)

ShowField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ])
}

ShowField.defaultProps = {
  label: null,
  value: null
}

export const Show = ({
  controller,
  value,
  onEdit,
  onDelete,
  onClose,
  classes,
  translations,
  layout,
  handles,
  label
}) => {
  const hideList = layout?.hide || []
  const userLayout = layout?.layout || []

  const inferShow = controller.type
    ? Array.from(controller.type.fields.values())
      .filter(({ name }) => hideList.indexOf(name) === -1)
      .reduce((register, field) => ({
        ...register,
        [field.name]: inferShowFactory(controller.type, classes, layout, handles)(field.name)
      }), {})
    : null

  const rowsLayout = [
    ...userLayout.map((row) => row.map((fieldName) => controller.type.fields.get(fieldName))),
    ...Array
      .from(controller.type.fields.values())
      .filter(({ name }) => name in inferShow)
      .filter(({ name }) => !userLayout.find((row) => row.indexOf(name) !== -1))
      .map((field) => [field])
  ]

  const isDeleted = useCallback((entity) => controller.status.get(entity[controller.type.ids[0]]) === 'deleted', [controller])
  const isMainEntity = onEdit && onClose && onDelete

  const entity = controller.query.data.find(
    (o) => isEqual(toInputIDs(controller.type)(o), toInputIDs(controller.type)(value))
  )

  return (
    <Grid container direction="column" {...!isMainEntity ? {} : { classes: { root: classes.halfWidth } }}>
      <Grid item>
        <Typography sx={{ fontWeight: 400 }} gutterBottom variant="h6">{label || translations?.type?.singular}</Typography>
      </Grid>
      <Grid item container spacing={2} classes={!isMainEntity ? { root: classes.innerShow } : {}}>
        {rowsLayout
          .map((fields) => (
            <Grid key={fields.map(({ name }) => name).join('-')} container item spacing={3}>
              <ShowRow
                fields={fields.map((field) => {
                  const Field = layout?.components?.[field.name] ?? ShowField
                  return [
                    field.name,
                    <Field
                      fullWidth
                      classes={classes}
                      label={translations?.fields?.[field.name] || field.name}
                      value={inferShow[field.name](entity[field.name])}
                    />
                  ]
                })}
              />
            </Grid>
          ))}
      </Grid>
      {isMainEntity
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
                {translations?.actions?.back ?? 'Back'}
              </Button>
              <Button
                color="primary"
                onClick={() => onEdit(entity)}
                startIcon={<EditIcon />}
                variant="contained"
                disabled={isDeleted(entity)}
              >
                {translations?.actions?.edit ?? 'Edit'}
              </Button>
              <Button
                color="primary"
                onClick={() => onDelete(entity)}
                startIcon={<DeleteIcon />}
                variant="contained"
                disabled={isDeleted(entity)}
              >
                {translations?.actions?.delete ?? 'Delete'}
              </Button>
            </Box>
          </Grid>
          )
        : null}
    </Grid>
  )
}

Show.propTypes = {
  type: TypePropTypes,
  classes: PropTypes.shape({
    innerShow: PropTypes.string,
    halfWidth: PropTypes.string
  }),
  translations: TranslationsPropTypes,
  layout: Form.propTypes.layout,
  handles: PropTypes.shape({}),
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  controller: ControllerPropTypes.isRequired,
  value: PropTypes.shape({}).isRequired,
  onEdit: PropTypes.func,
  label: PropTypes.string
}

Show.defaultProps = {
  type: null,
  classes: null,
  onClose: null,
  onDelete: null,
  onEdit: null,
  translations: TranslationsDefaultProps,
  layout: Form.defaultProps.layout,
  handles: {},
  label: null
}

export const TypedShow = ({ type, parentController, value, fieldName, ...props }) => {
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
        <Show
          controller={controller}
          value={controller.query.data[0]}
          {...props}
        />
        )
      : null
    : <Center><CircularProgress color="secondary" /></Center>
}

TypedShow.propTypes = {
  type: TypePropTypes.isRequired,
  parentController: ControllerPropTypes,
  value: PropTypes.shape({}),
  fieldName: PropTypes.string
}

TypedShow.defaultProps = {
  parentController: null,
  fieldName: null,
  value: null
}

export const TypeShow = ({ typeName, ...builderProps }) => (props) => {
  const { type } = useType(typeName)
  return type
    ? <TypedShow type={type} {...props} {...builderProps} />
    : <Center><CircularProgress color="secondary" /></Center>
}

TypeShow.propTypes = {
  typeName: PropTypes.string.isRequired,
  translations: Show.propTypes.translations,
  layout: Show.propTypes.layout
}

TypeShow.defaultProps = {
  translations: Show.defaultProps.translations,
  layout: Show.defaultProps.layout
}
