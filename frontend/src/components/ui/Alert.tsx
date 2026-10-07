import { Alert as MuiAlert, AlertProps } from '@mui/material';

interface AlertProps extends AlertProps {
  onClose?: () => void;
}

export function Alert({ onClose, ...props }: AlertProps) {
  return <MuiAlert {...props} onClose={onClose} variant="filled" />;
}