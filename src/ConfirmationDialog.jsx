import React from 'react'
import PropTypes from 'prop-types'

import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Dialog from '@material-ui/core/Dialog'
import DialogContentText from '@material-ui/core/DialogContentText'
import Slide from '@material-ui/core/Slide'
import Button from '@material-ui/core/Button'

const Transition = React.forwardRef((props, ref) => <Slide direction="up" {...props} ref={ref} />)

export const ConfirmationDialog = ({ open, onCancel, onConfirm, text }) => (
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
        Annuler
      </Button>
      <Button onClick={onConfirm} color="primary">
        Confirmer
      </Button>
    </DialogActions>
  </Dialog>
)

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  text: PropTypes.string
}

ConfirmationDialog.defaultProps = {
  text: 'Vraiment ?'
}

export default ConfirmationDialog
