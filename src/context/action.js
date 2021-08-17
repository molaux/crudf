import { useMemo } from 'react'
import {
  REGISTER_CONTROLLER,
  UNREGISTER_CONTROLLER,
  REGISTER_INTROSPECTION
} from './types'

export const useActions = (state, dispatch) => useMemo(() => ({
  invalidate: (typeName) => {
    for (const controller of state.current.controllers) {
      if (controller.type.name === typeName) {
        controller.query.refetch()
      }
    }
  },
  registerController: (controller) => {
    dispatch({ type: REGISTER_CONTROLLER, controller })
  },
  unregisterController: (controller) => {
    dispatch({ type: UNREGISTER_CONTROLLER, controller })
  },
  registerIntrospection: (introspection) => {
    dispatch({ type: REGISTER_INTROSPECTION, introspection })
  },
  getIntrospection: (name) => state.current.introspections[name]
}), [])

export default useActions
