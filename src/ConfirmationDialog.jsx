import React from 'react'
import PropTypes from 'prop-types'

import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Dialog from '@mui/material/Dialog'
import DialogContentText from '@mui/material/DialogContentText'
import Slide from '@mui/material/Slide'
import Button from '@mui/material/Button'

import { TranslationsPropTypes, TranslationsDefaultProps } from './propTypes'

const Transition = React.forwardRef((props, ref) => <Slide direction="up" {...props} ref={ref} />)

export const ConfirmationDialog = ({ open, onCancel, onConfirm, text, translations }) => (
  <Dialog
    open={open}
    TransitionComponent={Transition}
    keepMounted
    onClose={onCancel}
    aria-labelledby="alert-dialog-slide-title"
    aria-describedby="alert-dialog-slide-description"
  >
    <DialogContent>
      <DialogContentText id="alert-dialog-slide-description">
        {text}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="primary">
        {translations?.actions?.cancel ?? 'Cancel'}
      </Button>
      <Button onClick={onConfirm} color="primary">
        {translations?.actions?.confirm ?? 'Confirm'}
      </Button>
    </DialogActions>
  </Dialog>
)

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  text: PropTypes.string,
  translations: TranslationsPropTypes
}

ConfirmationDialog.defaultProps = {
  text: 'Vraiment ?',
  translations: TranslationsDefaultProps
}

export default ConfirmationDialog
