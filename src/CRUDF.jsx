/**
 *  @fileOverview Embed app loading animation container
 *
 *  @author       Marc-Olivier Laux
 */
import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'fast-deep-equal'

import { makeStyles } from '@mui/styles'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { Center } from '@molaux/mui-utils'
import { List } from './List'
import { Edit } from './Edit'
import { Show, TypedShow } from './Show'
import { Create } from './Create'
import { useType, TypePropTypes } from './graphql'
import { toInputIDs } from './inferInput'

import {
  EDIT_VIEW,
  CREATE_VIEW,
  LIST_VIEW,
  SHOW_VIEW
} from './types'

import { useController } from './controller'

import { ConfirmationDialog } from './ConfirmationDialog'

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: 200
  },
  mainBox: {
    marginTop: theme.spacing(3)
  },
  dataError: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.error.main,
    color: 'white',
    whiteSpace: 'nowrap'
  },
  linkTo: {
    whiteSpace: 'nowrap',
    textTransform: 'none'
  },
  actions: {
    whiteSpace: 'nowrap'
  },
  innerForm: {
    borderLeft: '2px solid black',
    borderLeftColor: theme.palette.primary.main,
    paddingLeft: theme.spacing(2)
  },
  innerShow: {
    borderLeft: '2px solid black',
    borderLeftColor: theme.palette.primary.main,
    marginLeft: theme.spacing(0),
    marginTop: theme.spacing(-1)
  },
  halfWidth: {
    [theme.breakpoints.up('lg')]: {
      width: '50%'
    }
  }
}))

const Typed = ({
  type,
  classes,
  translations,
  listLayout,
  editLayout,
  showLayout,
  createLayout,
  initialView,
  initialValue,
  handles
}) => {
  const [context, setContext] = useState({
    view: initialView || LIST_VIEW,
    data: initialValue || null
  })

  useEffect(() => {
    if (initialView) {
      setContext({ view: initialView, data: initialValue })
    }
  }, [initialView, initialValue, setContext])

  const controller = useController(type, { queryVariables: {} })

  useEffect(() => {
    controller.update.registerOnSaveCompleted({
      current: () => new Promise((resolve) => {
        setContext({ view: LIST_VIEW, data: null })
        resolve()
      })
    })
    return () => controller.update.unregisterOnSaveCompleted()
  }, [])

  const [confirmationDialogContext, setConfirmationDialogContext] = useState({
    open: false,
    action: null,
    data: null
  })

  const closeConfirmationDialog = useCallback(
    () => setConfirmationDialogContext((ctx) => ({ open: false, action: null, data: null })),
    [setConfirmationDialogContext]
  )

  const handleDelete = useCallback((entity) => {
    setConfirmationDialogContext({
      open: true,
      action: 'delete',
      data: entity
    })
  }, [setConfirmationDialogContext])

  const executeConfirmation = useCallback(() => {
    if (confirmationDialogContext.action === 'delete' && confirmationDialogContext.data) {
      controller.delete.delete(confirmationDialogContext.data)
      setContext({ view: LIST_VIEW, data: null })
    }
    closeConfirmationDialog()
  }, [closeConfirmationDialog, confirmationDialogContext])

  return (
    <>
      {context.view === LIST_VIEW
        ? (
          <List
            controller={controller}
            classes={classes}
            onEdit={(entity) => setContext({ view: EDIT_VIEW, data: entity })}
            onCreate={(entity) => setContext({ view: CREATE_VIEW, data: entity })}
            onShow={(entity) => setContext({ view: SHOW_VIEW, data: entity })}
            onDelete={handleDelete}
            translations={translations}
            handles={handles}
            layout={listLayout}
          />
          )
        : context.view === EDIT_VIEW
          ? (
            <Edit
              controller={controller}
              classes={classes}
              value={context.data}
              onClose={() => setContext({ view: LIST_VIEW, data: null })}
              onDelete={handleDelete}
              translations={translations}
              layout={editLayout}
            />
            )
          : context.view === CREATE_VIEW
            ? (
              <Create
                controller={controller}
                classes={classes}
                onClose={() => setContext({ view: LIST_VIEW, data: null })}
                translations={translations}
                layout={createLayout}
              />
              )
            : context.view === SHOW_VIEW
              ? controller.query.data?.find(
                (o) => isEqual(
                  toInputIDs(controller.type)(o), toInputIDs(controller.type)(context.data)
                )
              )
                ? (
                  <Show
                    controller={controller}
                    classes={classes}
                    value={context.data}
                    onClose={() => setContext({ view: LIST_VIEW, data: null })}
                    onEdit={(entity) => setContext({ view: EDIT_VIEW, data: entity })}
                    onDelete={handleDelete}
                    translations={translations}
                    layout={showLayout}
                    handles={handles}
                  />
                  )
                : (
                  <TypedShow
                    type={type}
                    classes={classes}
                    value={context.data}
                    onClose={() => setContext({ view: LIST_VIEW, data: null })}
                    onEdit={(entity) => setContext({ view: EDIT_VIEW, data: entity })}
                    onDelete={handleDelete}
                    translations={translations}
                    layout={showLayout}
                    handles={handles}
                  />
                  )
              : 'Not yet implemented'}
      <ConfirmationDialog
        open={confirmationDialogContext.open}
        onCancel={closeConfirmationDialog}
        onConfirm={executeConfirmation}
        translations={translations}
        text={translations?.actions?.deleteConfirmationText ?? 'Sure ?'}
      />
    </>
  )
}

Typed.propTypes = {
  type: TypePropTypes.isRequired,
  classes: PropTypes.shape({}).isRequired,
  translations: Edit.propTypes.translations,
  listLayout: List.propTypes.layout,
  editLayout: Edit.propTypes.layout,
  createLayout: Create.propTypes.layout,
  showLayout: Show.propTypes.layout,
  handles: Show.propTypes.handles,
  initialView: PropTypes.oneOf([SHOW_VIEW, EDIT_VIEW, LIST_VIEW, CREATE_VIEW]),
  initialValue: PropTypes.shape({})
}

Typed.defaultProps = {
  translations: Edit.defaultProps.translations,
  listLayout: List.defaultProps.layout,
  editLayout: Edit.defaultProps.layout,
  createLayout: Create.defaultProps.layout,
  showLayout: Show.defaultProps.layout,
  handles: Show.defaultProps.handles,
  initialView: LIST_VIEW,
  initialValue: null
}

export const CRUDF = ({ className, typeName, ...props }) => {
  const classes = useStyles()
  const { type } = useType(typeName)

  return (
    <div className={className}>
      <Box className={classes.mainBox}>
        {!type
          ? <Center><CircularProgress color="secondary" /></Center>
          : <Typed type={type} classes={classes} {...props} />}
      </Box>
    </div>
  )
}

CRUDF.propTypes = {
  typeName: PropTypes.string.isRequired,
  className: PropTypes.string
}

CRUDF.defaultProps = {
  className: null
}

export default CRUDF
