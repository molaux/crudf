/**
 *  @fileOverview Embed app loading animation container
 *
 *  @author       Marc-Olivier Laux
 */
import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import isEqual from 'fast-deep-equal'

import { makeStyles } from 'tss-react/mui'
import {
  Box,
  Typography,
  Grid
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'

import { Center } from '@molaux/mui-utils'
import { TypedList, List } from './List'
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

import { ControllerPropTypes, useController } from './controller'

import { ConfirmationDialog } from './ConfirmationDialog'

const useStyles = makeStyles()((theme) => ({
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
    // [theme.breakpoints.up('lg')]: {
    //   width: '50%'
    // }
  }
}))

export const CRUDF = ({
  type,
  classes,
  translations,
  listLayout,
  editLayout,
  showLayout,
  createLayout,
  initialView,
  value,
  parentController,
  fieldName,
  ownerEntity,
  handles,
  label
}) => {
  const [initialValue, setInitialValue] = useState(value)
  const [context, setContext] = useState({
    view: initialView || LIST_VIEW,
    data: initialValue || null
  })

  useEffect(() => {
    setInitialValue(value)
  }, [setInitialValue, value])

  useEffect(() => {
    if (initialView) {
      setContext({ view: initialView, data: initialValue })
    }
    return () => null
  }, [initialView, initialValue, setContext])

  const controller = useController(type, {
    owner: {
      controller: parentController,
      fieldName,
      entity: ownerEntity
    }
  })

  useEffect(() => {
    controller.update.registerOnSaveCompleted({
      current: (data) => new Promise((resolve) => {
        setContext({ view: LIST_VIEW, data: initialValue || null })
        resolve()
      })
    })
    return () => controller.update.unregisterOnSaveCompleted()
  }, [controller])

  useEffect(() => {
    controller.create.registerOnCreateCompleted({
      current: (data) => new Promise((resolve) => {
        setInitialValue((d) => d
          ? [...d, toInputIDs(type)(data)]
          : null)
        resolve()
      })
    })
    return () => controller.create.unregisterOnCreateCompleted()
  }, [controller])

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
    <Grid container direction="column" sx={{ maxWidth: '100%' }}>
      {label
        ? (
          <Grid item>
            <Typography sx={{ fontWeight: 400 }} gutterBottom variant="h6">{label}</Typography>
          </Grid>
          )
        : null}
      <Grid item container spacing={2} sx={label ? { paddingLeft: (theme) => theme.spacing(2) } : {}} classes={label ? { root: classes.innerShow } : {}}>
        {context.view === LIST_VIEW
          ? (
            <TypedList
              type={type}
              classes={classes}
              value={Array.isArray(context.data) ? context.data : null}
              onEdit={(entity) => setContext({ view: EDIT_VIEW, data: entity })}
              onCreate={(entity) => setContext({ view: CREATE_VIEW, data: entity })}
              onShow={(entity) => setContext({ view: SHOW_VIEW, data: entity })}
              onDelete={handleDelete}
              translations={translations}
              handles={handles}
              layout={listLayout}
              label={!label}
            />
            )
          : context.view === EDIT_VIEW
            ? (
              <Edit
                controller={controller}
                classes={classes}
                value={context.data}
                onClose={() => setContext({ view: LIST_VIEW, data: initialValue || null  })}
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
                  onClose={() => setContext({ view: LIST_VIEW, data: initialValue || null  })}
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
                      onClose={() => setContext({ view: LIST_VIEW, data: initialValue || null  })}
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
                      onClose={() => setContext({ view: LIST_VIEW, data: initialValue || null  })}
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
      </Grid>
    </Grid>
  )
}

CRUDF.propTypes = {
  type: TypePropTypes.isRequired,
  classes: PropTypes.shape({}).isRequired,
  translations: Edit.propTypes.translations,
  listLayout: List.propTypes.layout,
  editLayout: Edit.propTypes.layout,
  createLayout: Create.propTypes.layout,
  showLayout: Show.propTypes.layout,
  handles: Show.propTypes.handles,
  initialView: PropTypes.oneOf([SHOW_VIEW, EDIT_VIEW, LIST_VIEW, CREATE_VIEW]),
  initialValue: PropTypes.shape({}),
  parentController: ControllerPropTypes,
  value: PropTypes.arrayOf(PropTypes.shape({})),
  fieldName: PropTypes.string
}

CRUDF.defaultProps = {
  translations: Edit.defaultProps.translations,
  listLayout: List.defaultProps.layout,
  editLayout: Edit.defaultProps.layout,
  createLayout: Create.defaultProps.layout,
  showLayout: Show.defaultProps.layout,
  handles: Show.defaultProps.handles,
  initialView: LIST_VIEW,
  initialValue: null,
  parentController: null,
  fieldName: null,
  value: null
}

export const TypeCRUDF = ({ className, typeName, ...builderProps }) => (props) => {
  const { classes } = useStyles()
  const { type } = useType(typeName)

  return (
    <div className={className}>
      <Box className={classes.mainBox}>
        {!type
          ? <Center><CircularProgress color="secondary" /></Center>
          : <CRUDF type={type} classes={classes} {...props} {...builderProps} />}
      </Box>
    </div>
  )
}

TypeCRUDF.propTypes = {
  typeName: PropTypes.string.isRequired,
  className: PropTypes.string
}

TypeCRUDF.defaultProps = {
  className: null
}
