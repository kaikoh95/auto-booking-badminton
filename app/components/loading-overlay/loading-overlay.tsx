'use client'

import { styled } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';

const LoadingOverlay = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
}));

const LoadingIndicator = styled(CircularProgress)({
  color: '#fff',
});

// Usage
export default function Overlay (props: {loading: boolean}) {
  const { loading } = props;

  useEffect(() => {
    // Disable scrolling when the overlay is active
    document.querySelector('html')!.style.overflow = 'hidden';

    // Re-enable scrolling when the overlay is removed
    return () => {
      document.querySelector('html')!.style.overflow = 'auto';
    };
  }, []);

  return (
    <div>
      {loading && (
        <LoadingOverlay>
          <LoadingIndicator size={60} thickness={4} />
        </LoadingOverlay>
      )}
    </div>
  );
}
