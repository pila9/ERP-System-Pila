import { AlertDialog, AlertDialogTitle, AlertDialogContent, AlertDialogActions, AlertDialogAction, Button } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onClose={onClose}>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogContent>{message}</AlertDialogContent>
      <AlertDialogActions>
        <Button onClick={onClose} disabled={loading} variant="outlined">{cancelText}</Button>
        <AlertDialogAction onClick={onConfirm} autoFocus disabled={loading} color={variant === 'destructive' ? 'error' : 'primary'}>
          {loading ? 'Processing...' : confirmText}
        </AlertDialogAction>
      </AlertDialogActions>
    </AlertDialog>
  );
}