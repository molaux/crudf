import {
  REGISTER_CONTROLLER,
  UNREGISTER_CONTROLLER,
  REGISTER_INTROSPECTION
} from './types'

import { JSONWalk, JSONReviver } from '../json'

const initialState = {
  controllers: [],
  introspections: {}
}

const reducer = (state = initialState, action) => {
  const { controllers, introspections } = state
  const { type } = action
  switch (type) {
    case REGISTER_CONTROLLER:
      return {
        ...state,
        controllers: [
          ...controllers,
          action.controller
        ]
      }
    case UNREGISTER_CONTROLLER:
      return {
        ...state,
        controllers: [
          ...controllers.filter((c) => c !== action.controller)
        ]
      }
    case REGISTER_INTROSPECTION:
      return {
        ...state,
        introspections: {
          ...introspections,
          [action.introspection.name]: JSONWalk(action.introspection, JSONReviver)
        }
      }
    default:
      return state
  }
}

export { initialState, reducer }
