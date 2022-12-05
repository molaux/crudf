import React, { useMemo, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ShowIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'

import { useTheme } from '@mui/material/styles'

import { CommonTable, Center } from '@molaux/mui-utils'
import { inferShowFactory } from './inferShow'
import { useController, ControllerPropTypes } from './controller'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'
import { isSortable, isObject } from './inferTypes'
import { useType, TypePropTypes, getFinalType } from './graphql'

import { Show } from './Show'

import { pluralize } from './utils/string'
import { toInputIDs } from './inferInput'

const statusToColor = (status) => {
  switch (status) {
    case 'created':
      return 'lightgreen'
    case 'updated':
      return 'lightblue'
    case 'deleted':
      return 'darkgrey'
    default:
      return 'transparent'
  }
}
export const List = ({
  controller,
  onEdit,
  onCreate,
  onShow,
  onDelete,
  classes,
  translations,
  layout,
  handles,
  label
}) => {
  const theme = useTheme()
  const inferShow = controller.type
    ? Array.from(controller.type.fields.values()).reduce((register, field) => ({
      ...register,
      [field.name]: inferShowFactory(controller.type, classes, layout, handles, translations)(field.name)
    }), {})
    : null

  // useEffect(() => { controller.query.use() }, [])
  const hideList = layout?.hide || []
  const order = [...(layout?.order || [])].reverse()
  const isDeleted = useCallback((entity) => controller.status.get(entity[controller.type.ids[0]]) === 'deleted', [controller])

  return (
    <>
      {label === false
        ? null
        : (
          <Typography>
            {translations?.type?.plural ?? pluralize(translations?.type?.name) ?? pluralize(controller.type.name)}
          </Typography>
        )}
      <CommonTable
        borderLeftStyle={({ status }) => `${theme.spacing(3)} solid ${statusToColor(status)}`}
        hide={['status']}
        loading={controller.query.loading}
        rows={(controller.query.data || [])
          .map((row) => Object.keys(row)
            .filter((key) => hideList.indexOf(key) === -1 && (key in inferShow))
            .sort((a, b) => order.indexOf(b) - order.indexOf(a))
            .reduce((o, fieldName) => ({
              ...o,
              [translations?.fields?.[fieldName] || fieldName]:
                inferShow[fieldName](row[fieldName])
            }), {
              Actions: (
                <>
                  {onShow && <IconButton disabled={isDeleted(row)} onClick={() => onShow(row)} aria-label="show" color="primary"><ShowIcon /></IconButton>}
                  {onEdit && <IconButton disabled={isDeleted(row)} onClick={() => onEdit(row)} aria-label="edit" color="primary"><EditIcon /></IconButton>}
                  {onDelete && <IconButton disabled={isDeleted(row)} onClick={() => onDelete(row)} aria-label="delete" color="primary"><DeleteIcon /></IconButton>}
                </>
              ),
              status: controller.status.get(row[controller.type.ids[0]])
            }))}
        sortableHeaders={
          Array.from(controller.type.fields.values())
            .reduce(
              (o, { name, type }) => (isSortable(type)
                ? ({
                    ...o,
                    [translations?.fields?.[name] || name]: name
                  })
                : o),
              {}
            )
        }
        onSortHeader={(fieldName, order) => controller.query.setVariables({
          ...controller.query.variables,
          query: {
            ...controller.query.variables.query || {},
            ...order === null
              ? { order: [] }
              : {
                  order: [[
                    isObject(controller.type.fields.get(fieldName))
                      ? getFinalType(controller.type.fields.get(fieldName).type).fields.has('name')
                        ? `${getFinalType(controller.type.fields.get(fieldName).type).name}.name`
                        : `${getFinalType(controller.type.fields.get(fieldName).type).name}.id`
                      : fieldName,
                    order ? 'ASC' : 'DESC'
                  ]]
                }
          }
        })}
      />
      {onCreate
        ? (
          <Button
            color="primary"
            onClick={() => onCreate()}
            startIcon={<AddIcon />}
            variant="contained"
          >
            {translations?.type?.add ?? `Add ${translations?.type?.singular ?? controller.type.name}`}
          </Button>
        )
        : null}
    </>
  )
}

List.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onCreate: PropTypes.func,
  onShow: PropTypes.func,
  controller: ControllerPropTypes.isRequired,
  translations: TranslationsPropTypes,
  layout: PropTypes.shape({
    order: PropTypes.arrayOf(PropTypes.string),
    hide: PropTypes.arrayOf(PropTypes.string),
    layout: PropTypes.shape({})
  }),
  handles: Show.propTypes.handles,
  label: PropTypes.bool
}

List.defaultProps = {
  onEdit: null,
  onDelete: null,
  onCreate: null,
  onShow: null,
  translations: TranslationsDefaultProps,
  layout: {
    order: [],
    hide: [],
    layout: {}
  },
  handles: Show.defaultProps.handles,
  label: true
}

export default List

export const TypedList = ({ type, parentController, value, fieldName, ...props }) => {
  const queryVariables = useMemo(() => !value
  ? null
  : {
    query: {
      where: {
        _orOp: value
          .map((value) => toInputIDs(type)(value))
      } 
    }
  }, [value, type])

  const controller = useController(type, { queryVariables })

  useEffect(() => {
    controller.query.use()

    if (parentController && fieldName) {
      parentController.registerSubController(fieldName, controller)
      return () => parentController.unregisterSubController(fieldName)
    }
  }, [])

  return (
    <List
      controller={controller}
      value={controller.query.data}
      {...props}
    />
    )
}

TypedList.propTypes = {
  type: TypePropTypes.isRequired,
  parentController: ControllerPropTypes,
  value: PropTypes.arrayOf(PropTypes.shape({})),
  fieldName: PropTypes.string
}

TypedList.defaultProps = {
  parentController: null,
  fieldName: null,
  value: null
}

export const TypeList = ({ typeName, ...builderProps }) => (props) => {
  const { type } = useType(typeName)
  return type
    ? <TypedList type={type} {...props} {...builderProps} />
    : <Center><CircularProgress color="secondary" /></Center>
}

TypeList.propTypes = {
  typeName: PropTypes.string.isRequired,
  translations: Show.propTypes.translations,
  layout: Show.propTypes.layout
}

TypeList.defaultProps = {
  translations: Show.defaultProps.translations,
  layout: Show.defaultProps.layout
}
