import PropTypes from 'prop-types'

export const TranslationsPropTypes = PropTypes.shape({
  fields: PropTypes.shape({}),
  type: PropTypes.shape({
    singular: PropTypes.string,
    plural: PropTypes.string
  }),
  actions: PropTypes.shape({
    cancel: PropTypes.string,
    save: PropTypes.string,
    confirm: PropTypes.string,
    delete: PropTypes.string,
    edit: PropTypes.string,
    deleteConfirmationText: PropTypes.string
  })
})

export const TranslationsDefaultProps = {
  fields: {},
  type: {
    singular: null,
    plural: null
  },
  actions: {}
}
