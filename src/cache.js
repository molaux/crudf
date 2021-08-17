import { defaultDataIdFromObject, useApolloClient } from '@apollo/client'

import { klona } from 'klona/lite'
import pluralize from 'pluralize'

export const CACHE_ALL = 0
export const CACHE_PICK = 1

export const useCache = (type) => {
  const apolloClient = useApolloClient()

  const remove = (query, variables, removals) => {
    if (!removals.length) {
      return
    }

    const idKey = type.ids[0]
    const idsToRemove = removals.map((r) => r[idKey])

    const objects = klona(apolloClient.readQuery({
      query,
      variables
    }))

    objects[pluralize(type.name)] = objects[pluralize(type.name)].filter(
      (o) => idsToRemove.indexOf(o[idKey]) === -1
    )
    apolloClient.writeQuery({
      query,
      variables,
      data: objects
    })
  }

  const add = (query, variables, additions) => {
    if (!additions.length) {
      return
    }

    const objects = klona(apolloClient.readQuery({
      query,
      variables
    }))

    objects[pluralize(type.name)] = objects[pluralize(type.name)].concat(additions)
    apolloClient.writeQuery({
      query,
      variables,
      data: objects
    })
  }

  const update = (query, fragment, variables, updates) => {
    if (!updates.length) {
      return
    }

    const idKey = type.ids[0]

    const cacheRetrievalStrategy = variables ? CACHE_ALL : CACHE_PICK

    const map = cacheRetrievalStrategy === CACHE_ALL
      ? new Map(updates.map((update) => [update[idKey], update]))
      : null

    // for (const { forecast } of updates) {
    //   localStatus.delete(forecast.article.id)
    // }

    const cachedObjects = cacheRetrievalStrategy === CACHE_ALL
      ? klona(apolloClient.readQuery({
        query,
        variables
      }))
      : {
          [pluralize(type.name)]: updates.map((input) => klona(apolloClient.readFragment({
            id: defaultDataIdFromObject(input),
            fragment
          })))
        }

    if (!cachedObjects) {
      return
    }
    // for (const object of cachedObjects[pluralize(type.name)]) {
    //   if (cacheRetrievalStrategy === CACHE_PICK || map.has(update[idKey])) {
    //     // localStatus.delete(forecast.article.id)
    //   }
    //   // if (!initialRequestedQuantitiesRef.current.has(forecast.id)) {
    //   //   initialRequestedQuantitiesRef.current.set(forecast.id, forecast.userRequestedQuantity)
    //   // }
    // }

    cachedObjects[pluralize(type.name)] = cachedObjects[pluralize(type.name)]
      .map((object, index) => ({
        ...object,
        ...(cacheRetrievalStrategy === CACHE_PICK
          ? updates[index]
          : map.has(object[idKey])
            ? map.get(object[idKey]).update
            : {})
      }))

    // setLocalStatus(localStatus)

    if (cacheRetrievalStrategy === CACHE_ALL) {
      apolloClient.writeQuery({
        query,
        variables,
        data: cachedObjects
      })
    } else {
      for (const mutatedObject of cachedObjects[pluralize(type.name)]) {
        apolloClient.writeFragment({
          id: defaultDataIdFromObject(mutatedObject),
          fragment,
          data: mutatedObject
        })
      }
    }
  }
  return { update, add, remove }
}

export default useCache
