import { useMemo, useState, useCallback, useRef, useEffect, useContext } from 'react'
import PropTypes from 'prop-types'

import {
  useMutation,
  useQuery,
  useSubscription
} from '@apollo/client'

import { klona } from 'klona/lite'
import pluralize from 'pluralize'
import isEqual from 'fast-deep-equal'

import { inferData, isObject, isMandatory } from './inferTypes'
import { useCache } from './cache'
import { toInput, toInputIDs, defaultEntity } from './inferInput'

import { CRUDFContext } from './context'

import {
  ENTITIES_QUERY,
  ENTITIES_UPDATE_MUTATION,
  ENTITIES_CREATE_MUTATION,
  ENTITIES_DELETE_MUTATION,
  ENTITY_FRAGMENT,
  ENTITIES_CREATED_SUBSCRIPTION,
  ENTITIES_DELETED_SUBSCRIPTION,
  ENTITIES_UPDATED_SUBSCRIPTION,
  TypePropTypes,
  getFinalType
} from './graphql'

export const useController = (type, { queryVariables: initialQueryVariables }) => {
  const [[status], setStatuss] = useState([new Map()])
  const setStatus = (map) => setStatuss([map])
  const onSaveCompleted = useRef()
  const [subControllers, setSubControllers] = useState({})
  const registerSubController = useCallback((fieldName, controller) => {
    controller.update.registerOnSaveCompleted(onSaveCompleted)
    setSubControllers((subControllers) => ({
      ...subControllers,
      [fieldName]: controller
    }))
  }, [setSubControllers])

  const unregisterSubController = useCallback(
    (fieldName) => setSubControllers((controllers) => Object
      .keys(controllers)
      .reduce((c, k) => {
        if (k === fieldName) {
          // controllers[fieldName].update.unregisterOnSaveCompleted()
          return c
        }
        return {
          ...c,
          [k]: controllers[k]
        }
      }, {})),
    [setSubControllers]
  )

  const { registerController, unregisterController, invalidate } = useContext(CRUDFContext)

  const [parentOnSaveCompleted, setParentOnSaveCompleted] = useState(null)
  const registerOnSaveCompleted = useCallback((func) => {
    setParentOnSaveCompleted(() => func)
  }, [setParentOnSaveCompleted])

  const unregisterOnSaveCompleted = useCallback(() => {
    setParentOnSaveCompleted(null)
  }, [setParentOnSaveCompleted])

  const [queryVariables, setQueryVariables] = useState(
    initialQueryVariables?.query ? initialQueryVariables : { ...initialQueryVariables, query: {} }
  )

  const [
    TYPE_UPDATE_MUTATION,
    TYPE_CREATE_MUTATION,
    TYPE_DELETE_MUTATION,
    TYPE_FRAGMENT,
    TYPE_QUERY,
    TYPE_CREATED_SUBSCRIPTION,
    TYPE_DELETED_SUBSCRIPTION,
    TYPE_UPDATED_SUBSCRIPTION
  ] = useMemo(() => [
    ENTITIES_UPDATE_MUTATION(type),
    ENTITIES_CREATE_MUTATION(type),
    ENTITIES_DELETE_MUTATION(type),
    ENTITY_FRAGMENT(type),
    ENTITIES_QUERY(type),
    ENTITIES_CREATED_SUBSCRIPTION(type),
    ENTITIES_DELETED_SUBSCRIPTION(type),
    ENTITIES_UPDATED_SUBSCRIPTION(type)
  ], [type])

  // Retrieve

  const [skipQuery, setSkipQuery] = useState(true)
  const startQuery = useCallback(
    (start) => setSkipQuery(start === undefined ? false : !start),
    [setSkipQuery]
  )

  const [data, setData] = useState(null)
  const { refetch, loading, data: originalData } = useQuery(TYPE_QUERY, {
    fetchPolicy: 'cache-and-network',
    variables: queryVariables,
    skip: skipQuery
  })

  useEffect(() => { // onCompleted workaround (not fired on cache fetch...)
    if (originalData != null) {
      setData(inferData(type, klona(originalData[pluralize(type.name)])))
    }
    return () => null
  }, [originalData])

  const { update: updateTypeCache, add: addTypeCache, remove: removeTypeCache } = useCache(type)

  // Delete
  const propagateDelete = (values, isForeign) => {
    const idKey = type.ids[0]

    if (isForeign) {
      for (const value of values) {
        status.set(value[idKey], 'deleted')
      }
      setStatus(status)
    } else {
      const invalidateTypes = [type.name]
      for (const newObject of values) {
        for (const field of Array.from(
          type.fields.values()
        ).filter((field) => isObject(getFinalType(field.type)))) {
          if (newObject[field.name]) {
            invalidateTypes.push(getFinalType(field.type).name)
          }
        }
      }
      for (const typeName of invalidateTypes) {
        invalidate(typeName)
      }
      removeTypeCache(TYPE_QUERY, queryVariables, values)
    }
  }

  const [deleteMutation] = useMutation(TYPE_DELETE_MUTATION, {
    onCompleted: (deleteData) => {
      propagateDelete(deleteData[`delete${type.name}`])
    }
  })

  const deleteEntity = useCallback((value) => {
    deleteMutation({
      variables: {
        ids: toInputIDs(type)(value)[type.ids[0]]
      }
    })
  }, [deleteMutation, type])

  // Update
  const propagateUpdate = (values, isForeign) => {
    if (!values.length) {
      return
    }
    const idKey = type.ids[0]
    updateTypeCache(TYPE_QUERY, TYPE_FRAGMENT, queryVariables, values)
    const invalidateTypes = []
    // TODO : update the sort place / take filter into account
    setData((prevData) => (prevData || []).map((previousObject) => {
      const updatedObject = values.find((v) => v[idKey] === previousObject[idKey])
      if (updatedObject) {
        const inferedUpdatedObject = inferData(type, klona(updatedObject))
        for (const field of Array.from(
          type.fields.values()
        ).filter((field) => isObject(getFinalType(field.type)))) {
          if (!isEqual(inferedUpdatedObject[field.name], previousObject[field.name])) {
            invalidateTypes.push(getFinalType(field.type).name)
          }
        }
        return inferedUpdatedObject
      }
      return previousObject
    }))

    if (isForeign) {
      for (const value of values) {
        status.set(value[idKey], 'updated')
      }
      setStatus(status)
    } else {
      for (const typeName of invalidateTypes) {
        invalidate(typeName)
      }
    }
  }

  const [mutate, { loading: mutationLoading }] = useMutation(TYPE_UPDATE_MUTATION, {
    fetchPolicy: 'no-cache',
    onCompleted: async (updateData) => {
      propagateUpdate(updateData[`update${type.name}`])
      await parentOnSaveCompleted?.current(updateData)
    }
  })

  const save = useCallback(async (input, value) => {
    const oids = toInputIDs(type)(value)
    // trigger save to sub controllers
    if (Object.keys(subControllers).filter((fieldName) => fieldName in input).length) {
      let count = 0
      // when all subCOntrollers have saved, save itself
      onSaveCompleted.current = async (data) => {
        count += 1
        if (count === Object
          .keys(subControllers)
          .filter((fieldName) => fieldName in input).length) {
          count = 0
          const inputWithoutSubControllers = Object.keys(input)
            .filter((fieldName) => !(fieldName in subControllers))
            .reduce((i, fieldName) => ({ ...i, [fieldName]: input[fieldName] }), {})

          await mutate({
            variables: {
              input: toInput(type, inputWithoutSubControllers),
              ids: [oids[type.ids[0]]]
            }
          })
        }
      }

      // trigger save to all subscontrollers (will trigger above
      // onSaveCompleted when the last completes)
      const promises = []
      for (const fieldName of Object
        .keys(subControllers)
        .filter((fieldName) => fieldName in input)) {
        promises.push(subControllers[fieldName].update.save(input[fieldName], value[fieldName]))
      }
      await Promise.all(promises)
    } else {
      await mutate({
        variables: {
          input: toInput(type, input),
          ids: [oids[type.ids[0]]]
        }
      })
    }
  }, [mutate, type, subControllers])

  // Create
  const emptyEntity = useMemo(() => defaultEntity(type), [type])

  const propagateCreate = (values, isForeign) => {
    if (!Array.isArray(values) && values) {
      values = [values]
    }

    if (!values.length) {
      return
    }

    if (isForeign) {
      addTypeCache(TYPE_QUERY, queryVariables, values)

      // TODO : insert at the sort place / take filter into account
      setData((prevData) => prevData.concat(
        values.map((createdObject) => inferData(type, klona(createdObject)))
      ))
      const idKey = type.ids[0]

      for (const value of values) {
        status.set(value[idKey], 'created')
      }
      setStatus(status)
    } else if (!skipQuery) {
      const invalidateTypes = [type.name]
      for (const newObject of values) {
        for (const field of Array.from(
          type.fields.values()
        ).filter((field) => isObject(getFinalType(field.type)))) {
          if (newObject[field.name]) {
            invalidateTypes.push(getFinalType(field.type).name)
          }
        }
      }
      for (const typeName of invalidateTypes) {
        invalidate(typeName)
      }
    }
  }

  const [createMutation, { loading: creationLoading }] = useMutation(TYPE_CREATE_MUTATION, {
    onCompleted: (createData) => propagateCreate(createData[`create${type.name}`])
  })

  const create = useCallback(async (input) => {
    await createMutation({
      variables: {
        input: {
          ...Object
            .keys(input)
            .filter((field) => input[field] !== null || isMandatory(type.fields.get(field).inputType))
            .reduce((o, field) => ({
              ...o,
              [field]: input[field] 
            }), {})
        }
      }
    })
  }, [createMutation])

  // Follow
  useSubscription(TYPE_DELETED_SUBSCRIPTION, {
    fetchPolicy: 'no-cache', // Avoid auto mutate the cache before onSubscriptionData is called : it will be done explicitly
    variables: queryVariables,
    onSubscriptionData: ({
      subscriptionData: {
        data: deletedData
      }
    }) => propagateDelete(deletedData[`deleted${type.name}`], true)
  })

  useSubscription(TYPE_UPDATED_SUBSCRIPTION, {
    fetchPolicy: 'no-cache', // Avoid auto mutate the cache before onSubscriptionData is called : it will be done explicitly
    variables: queryVariables,
    onSubscriptionData: ({
      subscriptionData: {
        data: updatedData
      }
    }) => propagateUpdate(updatedData[`updated${type.name}`], true)
  })

  useSubscription(TYPE_CREATED_SUBSCRIPTION, {
    fetchPolicy: 'no-cache', // Avoid auto mutate the cache before onSubscriptionData is called : it will be done explicitly
    variables: queryVariables,
    onSubscriptionData: ({
      subscriptionData: {
        data: createdData
      }
    }) => propagateCreate(createdData[`created${type.name}`], true)
  })

  const controller = useMemo(() => ({
    type,
    status,
    fragment: TYPE_FRAGMENT,
    query: {
      use: startQuery,
      variables: queryVariables,
      query: TYPE_QUERY,
      data,
      setVariables: setQueryVariables,
      loading,
      refetch
    },
    update: {
      save,
      mutation: TYPE_UPDATE_MUTATION,
      loading: mutationLoading,
      registerOnSaveCompleted,
      unregisterOnSaveCompleted
    },
    create: {
      save: create,
      defaultValue: emptyEntity,
      mutation: TYPE_CREATE_MUTATION,
      loading: creationLoading
    },
    delete: {
      delete: deleteEntity,
      mutation: TYPE_DELETE_MUTATION
    },
    registerSubController,
    unregisterSubController
  }), [
    type,
    status,
    TYPE_FRAGMENT,
    startQuery,
    queryVariables,
    TYPE_QUERY,
    data,
    setQueryVariables,
    loading,
    refetch,
    save,
    TYPE_UPDATE_MUTATION,
    registerOnSaveCompleted,
    unregisterOnSaveCompleted,
    create,
    emptyEntity,
    TYPE_CREATE_MUTATION,
    deleteEntity,
    TYPE_DELETE_MUTATION,
    registerSubController,
    unregisterSubController
  ])

  useEffect(() => {
    registerController(controller)
    return () => unregisterController(controller)
  }, [controller])

  return controller
}

export const ControllerPropTypes = PropTypes.shape({
  type: TypePropTypes.isRequired,
  status: PropTypes.instanceOf(Map).isRequired,
  fragment: PropTypes.shape({}).isRequired,
  query: PropTypes.shape({
    use: PropTypes.func.isRequired,
    variables: PropTypes.shape({}),
    query: PropTypes.shape({}).isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({})),
    setVariables: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    refetch: PropTypes.func.isRequired
  }),
  update: PropTypes.shape({
    save: PropTypes.func.isRequired,
    mutation: PropTypes.shape({}).isRequired,
    registerOnSaveCompleted: PropTypes.func.isRequired,
    unregisterOnSaveCompleted: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
  }),
  create: PropTypes.shape({
    save: PropTypes.func.isRequired,
    defaultValue: PropTypes.shape({}).isRequired,
    mutation: PropTypes.shape({}).isRequired,
    loading: PropTypes.bool.isRequired
  }),
  delete: PropTypes.shape({
    delete: PropTypes.func.isRequired,
    mutation: PropTypes.shape({}).isRequired
  }),
  registerSubController: PropTypes.func.isRequired,
  unregisterSubController: PropTypes.func.isRequired
})

export default useController
