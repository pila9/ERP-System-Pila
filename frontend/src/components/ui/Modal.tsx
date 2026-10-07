import { Modal as MuiModal, Box, Paper, IconButton, Typography, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { forwardRef, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>((props, ref) => {
  const { open, onClose, title, children, fullWidth = false, maxWidth = 'md' } = props;
  const theme = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <MuiModal
      ref={ref}
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Box}
      BackdropProps={{ sx: { bgcolor: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: fullWidth ? '100%' : { xs: '95%', sm: maxWidth },
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </MuiModal>
  );
});

Modal.displayName = 'Modal';