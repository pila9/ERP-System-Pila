import { Card as MuiCard, CardContent, CardHeader, CardActions, CardProps } from '@mui/material';
import { forwardRef } from 'react';

interface CardPropsExtended extends CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardPropsExtended>((props, ref) => {
  const { title, subtitle, action, children, ...rest } = props;
  return (
    <MuiCard ref={ref} {...rest}>
      {(title || action) && (
        <CardHeader title={title} subheader={subtitle} action={action} />
      )}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
});

Card.displayName = 'Card';