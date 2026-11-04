import { Alert, Box, Button, Typography } from '@mui/material';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '@store/authStore';
import { getRoleFromToken } from '@utils/auth';

export default function ProtectedRoute({ allowedRoles, children }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const navigate = useNavigate();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = getRoleFromToken(accessToken);
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>You do not have permission to access this page.</Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your current role is: {role || 'unknown'}.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/warehouse')}>Back to warehouse</Button>
      </Box>
    );
  }

  return children || <Outlet />;
}
