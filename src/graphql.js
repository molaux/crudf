import { useState, useContext } from 'react'
import { propType as graphQLPropTypes } from 'graphql-anywhere'
import pluralize from 'pluralize'
import { klona } from 'klona/lite'
import PropTypes from 'prop-types'
import isEqual from 'fast-deep-equal/es6'

import { useQuery, gql } from '@apollo/client'

import { JSONReplacer } from './json'
import { CRUDFContext } from './context'

export const getFinalType = (type) => (type.ofType
  ? getFinalType(type.ofType)
  : type)

const mapizeFields = (o) => {
  const type = getFinalType(o)
  if (Array.isArray(type.fields)) {
    type.fields = new Map(type.fields.map((field) => {
      mapizeFields(field.type)
      return [field.name, field]
    }))
  } else if (Array.isArray(type.inputFields)) {
    type.inputFields = new Map(type.inputFields.map((inputField) => {
      mapizeFields(inputField.type)
      return [inputField.name, inputField]
    }))
  }
}

export const useType = (typeName) => {
  const { getIntrospection } = useContext(CRUDFContext)
  const providedType = getIntrospection(typeName)
  if (process.env.NODE_ENV !== 'development') {
    if (providedType) {
      return { type: providedType, loading: false }
    }
    throw Error(`You have not provided introspection result for ${typeName} : it cannot be computed in production envirronment`)
  }

  const [type, setType] = useState(null)
  const [objectFields, setObjectFields] = useState(null)

  const { data: typesData } = useQuery(TYPE_INTROSPECTION([
    { alias: 'type', variable: 'name', fields: 'fields' },
    { alias: 'inputType', variable: 'inputName', fields: 'inputFields' }
  ]), {
    variables: {
      name: typeName,
      inputName: `${typeName}CreateInput`
    },
    onCompleted: (typeData) => {
      setObjectFields(klona((typeData?.type.fields || []).filter((field) => getFinalType(field.type).kind === 'OBJECT')))
    }
  })

  const typeData = typesData?.type
  const inputTypeData = typesData?.inputType

  const { data: validators } = useQuery(
    typeData
      ? ENTITIES_VALIDATOR_INTROSPECTION(typeData)
      : gql`query { __typename }`,
    {
      skip: !typeData
    }
  )

  useQuery(
    objectFields
      ? ENTITIES_ID_INTROSPECTION(
        objectFields
          .map((field) => getFinalType(field.type))
          .concat(typeData)
      )
      : gql`query { __typename }`,
    {
      skip: !objectFields || !typeData || !validators,
      onCompleted: (data) => {
        const type = klona(typeData)
        const inputType = klona(inputTypeData)
        const objectsIDs = klona(data)
        const fieldsValidators = validators[`${type.name}Validator`]

        mapizeFields(type)
        mapizeFields(inputType)

        for (const field of objectFields) {
          const finalType = getFinalType(field.type)
          mapizeFields(objectsIDs[`${finalType.name}ID`])
          const ids = objectsIDs[`${finalType.name}ID`].fields
          getFinalType(type.fields.get(field.name).type).fields = new Map([
            ...Array.from(ids.entries()),
            ...Object.values(finalType.fields)
              .filter(({ name }) => name === 'name')
              .map((field) => [field.name, field])
          ])
          getFinalType(type.fields.get(field.name).type).ids = Array.from(ids.keys())
        }
        type.ids = objectsIDs[`${type.name}ID`].fields.map(({ name }) => name)

        for (const field of type.fields.values()) {
          field.inputType = inputType.inputFields.get(field.name)
          getFinalType(field.inputType).validator = field.name in fieldsValidators
            ? fieldsValidators[field.name]
            : null
        }

        setType(type)

        if (providedType === null || !isEqual(type, providedType)) {
          const computedJson = JSON.stringify(type, JSONReplacer)

          // eslint-disable-next-line no-console
          console.warn(providedType === undefined
            ? `You have not provided the ${type.name} type introspection, consider providing it through registerIntrospection :`
            : `The ${type.name} type introspection you provided differs from the one just computed, you should update it with :`)
          // eslint-disable-next-line no-console
          console.log(`${type.name} type :`, computedJson)
        }
      }
    }
  )

  return {
    type,
    loading: !!type
  }
}

export const TypePropTypes = PropTypes.shape({
  name: PropTypes.string.isRequired,
  ids: PropTypes.arrayOf(PropTypes.string).isRequired,
  fields: PropTypes.instanceOf(Map)
})

export const FieldPropTypes = PropTypes.shape({
  name: PropTypes.string.isRequired,
  type: PropTypes.shape({
    name: PropTypes.string,
    kind: PropTypes.string.isRequired
  }),
  inputType: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.shape({
      name: PropTypes.string,
      kind: PropTypes.string.isRequired
    }),
    validator: PropTypes.shape({})
  })
})

export const ENTITIES_ID_INTROSPECTION = (types) => gql`query {
  ${types.map(({ name }) => `${name}ID: __type(name: "${name}ID") {
    fields {
      name
      type { name }
    }
  }\n`)}
}`

export const ENTITIES_VALIDATOR_INTROSPECTION = (type) => gql`query {
  ${type.name}Validator {
    ${type.fields.filter((field) => getFinalType(field.type).kind !== 'OBJECT').map(({ name }) => name).join('\n')}
  }
}`

const typeQuery = (fields, variable) => `
__type(name: $${variable}) {
  name
  description
  ${fields} {
    name
    description
    type {
      name
      kind
      ${fields} {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
      ofType {
        name
        kind
        ${fields} {
          name
          description
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
}
`

export const TYPE_INTROSPECTION = (types) => gql`query Entity(${types.map(({ variable }) => `$${variable}: String!`).join(', ')}) {
  ${types.map(({ alias, variable, fields }) => `${alias}: ${typeQuery(fields, variable)}\n`)}
}`

export const ENTITY_FRAGMENT = (type) => {
  const FRAGMENT = gql`
    fragment ${type.name}Details on ${type.name} {
      ${Array.from(type.fields.values()).map((field) => (getFinalType(field.type).kind === 'OBJECT'
        ? `${field.name} {
            ${Array.from(getFinalType(field.type).fields.values()).map(({ name }) => `${name}\n`)}
          }\n`
        : `${field.name}\n`))}
    }
  `
  FRAGMENT.propTypes = graphQLPropTypes(FRAGMENT)
  return FRAGMENT
}

export const ENTITIES_QUERY = (type) => gql`
  query ${pluralize(type.name)}($query: JSON!) {
    ${pluralize(type.name)}(query: $query) {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`

export const ENTITIES_CREATED_SUBSCRIPTION = (type) => gql`
  subscription created${type.name} {
    created${type.name} {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`

export const ENTITIES_UPDATED_SUBSCRIPTION = (type) => gql`
  subscription updated${type.name} {
    updated${type.name} {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`

export const ENTITIES_DELETED_SUBSCRIPTION = (type) => gql`
  subscription deleted${type.name} {
    deleted${type.name} {
      id
    }
  }
`

export const ENTITIES_CREATE_MUTATION = (type) => gql`
  mutation create${type.name}($input: ${type.name}CreateInput) {
    create${type.name}(input: $input, atomic: true) {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`

export const ENTITIES_UPDATE_MUTATION = (type) => gql`
  mutation update${type.name}($input: ${type.name}UpdateInput, $ids: [ID]!) {
    update${type.name}(input: $input, query: { where: { ${type.ids[0]}: { _inOp: $ids } } }, atomic: true) {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`

export const ENTITIES_DELETE_MUTATION = (type) => gql`
  mutation delete${type.name}($ids: [ID]!) {
    delete${type.name}(query: { where: { ${type.ids[0]}: { _inOp: $ids } } }, atomic: true) {
      ...${type.name}Details
    }
  }
  ${ENTITY_FRAGMENT(type)}
`
