import { Button as MuiButton, ButtonProps } from '@mui/material';
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { variant = 'contained', size = 'small', ...rest } = props;
  return <MuiButton ref={ref} variant={variant} size={size} {...rest} />;
});

Button.displayName = 'Button';