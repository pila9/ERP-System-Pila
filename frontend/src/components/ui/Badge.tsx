import { Chip, ChipProps } from '@mui/material';

interface BadgeProps extends ChipProps {
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'filled' | 'outlined' | 'light';
}

const colorMap = {
  default: 'default',
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
} as const;

export function Badge({ color = 'default', variant = 'filled', ...props }: BadgeProps) {
  return <Chip color={colorMap[color]} variant={variant} {...props} />;
}