import PropTypes from 'prop-types'

export const TranslationsPropTypes = PropTypes.shape({
  fields: PropTypes.shape({}),
  type: PropTypes.shape({
    singular: PropTypes.string,
    plural: PropTypes.string
  })
})

export const TranslationsDefaultProps = {
  fields: {},
  type: {
    singular: null,
    plural: null
  }
}
