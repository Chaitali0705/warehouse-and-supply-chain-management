import { menuItems } from './MenuConfig';
import Toolbar from '../../components/Toolbar';
import { Box } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import useAuthStore from '@store/authStore';
import { getRoleFromToken } from '@utils/auth';

export default function Report() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = getRoleFromToken(accessToken);
  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(role)),
    [role]
  );
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  useEffect(() => {
    if (!availableMenuItems.some((item) => item.id === selectedMenuId)) {
      setSelectedMenuId(availableMenuItems[0]?.id ?? null);
    }
  }, [availableMenuItems, selectedMenuId]);

  const selectedItem = availableMenuItems.find((item) => item.id === selectedMenuId);

  const ReportComponent = selectedItem?.ReportComponent;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Toolbar
        menuItems={availableMenuItems}
        selectedId={selectedMenuId}
        onSelect={setSelectedMenuId}
      />

      {ReportComponent ? <ReportComponent /> : null}
    </Box>
  );
}
