import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ShowIcon
} from '@mui/icons-material'

import pluralize from 'pluralize'

import { useTheme } from '@mui/material/styles'

import { CommonTable, Center } from '@molaux/mui-utils'
import { inferShowFactory } from './inferShow'
import { ControllerPropTypes } from './controller'
import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'
import { isSortable, isObject } from './inferTypes'
import { getFinalType } from './graphql'
import { Show } from './Show'

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
  handles
}) => {
  const theme = useTheme()
  const inferShow = controller.type
    ? Array.from(controller.type.fields.values()).reduce((register, field) => ({
      ...register,
      [field.name]: inferShowFactory(controller.type, classes, layout, handles)(field.name)
    }), {})
    : null

  useEffect(() => controller.query.use(), [])
  const hideList = layout?.hide || []
  const order = [...(layout?.order || [])].reverse()
  const isDeleted = useCallback((entity) => controller.status.get(entity[controller.type.ids[0]]) === 'deleted', [controller])

  return (
    <>
      <Typography>{pluralize(controller.type.name)}</Typography>
      {!controller.query.data
        ? <Center><CircularProgress color="secondary" /></Center>
        : (
          <>
            <CommonTable
              borderLeftStyle={({ status }) => `${theme.spacing(3)} solid ${statusToColor(status)}`}
              hide={['status']}
              rows={controller.query.data
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
            <Button
              color="primary"
              onClick={() => onCreate()}
              startIcon={<AddIcon />}
              variant="contained"
            >
              Ajouter
            </Button>
          </>
          )}
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
  handles: Show.propTypes.handles
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
  handles: Show.defaultProps.handles
}

export default List
