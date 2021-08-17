import React, { createContext, useRef, useCallback } from 'react'
import { PropTypes } from 'prop-types'

import { reducer, initialState } from './reducer'
import { useActions } from './action'

const CRUDFContext = createContext()

const CRUDFProvider = ({ children }) => {
  const state = useRef(initialState)
  const dispatch = useCallback((action) => {
    state.current = reducer(state.current, action)
  }, [state])
  const actions = useActions(state, dispatch)

  return (
    <CRUDFContext.Provider value={actions}>
      {children}
    </CRUDFContext.Provider>
  )
}

CRUDFProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}

export { CRUDFContext, CRUDFProvider }
