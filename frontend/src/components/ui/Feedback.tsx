import { Box, Typography, CircularProgress, Skeleton, Alert } from '@mui/material';

interface FeedbackProps {
  loading?: boolean;
  error?: string | Error | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  skeletonCount?: number;
}

export function Feedback({ loading = false, error = null, empty = false, emptyMessage = 'No data available', children, skeletonCount = 5 }: FeedbackProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
        {[...Array(skeletonCount)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={52} width="100%" />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography>{error instanceof Error ? error.message : error}</Typography>
      </Alert>
    );
  }

  if (empty) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{emptyMessage}</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}