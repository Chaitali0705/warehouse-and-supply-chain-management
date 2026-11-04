import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import { BrainCircuit, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import api from '@utils/axiosInstance';

const severityColor = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

export default function AiInsightsReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/ai-insights');
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <BrainCircuit color="#7f408e" size={30} />
            <Typography variant="h4" fontWeight={700}>AI Supply Chain Insights</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Offline decision support generated from stock, expiry, purchase order, and forecast signals.
          </Typography>
        </Box>
        <Button startIcon={<RefreshCw size={18} />} variant="contained" onClick={loadInsights} disabled={loading}>
          Refresh analysis
        </Button>
      </Stack>

      <Alert icon={<ShieldCheck size={20} />} severity="info" sx={{ mb: 3 }}>
        Transparent rule-based analysis: no external AI API or key is used. Every recommendation explains the SQL data signal that produced it.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              ['Total recommendations', data.summary.total, '#7f408e'],
              ['Critical action needed', data.summary.critical, '#dc2626'],
              ['High priority', data.summary.high, '#d97706'],
              ['Medium priority', data.summary.medium, '#2563eb'],
            ].map(([label, value, color]) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
                <Paper sx={{ p: 2.5, borderTop: `4px solid ${color}` }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={700}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Stack spacing={2}>
            {data.insights.map((insight) => (
              <Paper key={insight.id} sx={{ p: 2.5, borderLeft: '5px solid', borderColor: `${severityColor[insight.severity]}.main` }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TriangleAlert size={18} />
                      <Typography variant="h6" fontWeight={700}>{insight.title}</Typography>
                      <Chip label={insight.severity.toUpperCase()} color={severityColor[insight.severity]} size="small" />
                      <Chip label={insight.category} variant="outlined" size="small" />
                    </Stack>
                    <Typography color="text.secondary">{insight.explanation}</Typography>
                    <Typography sx={{ mt: 1 }}><strong>Recommended action:</strong> {insight.recommendation}</Typography>
                  </Box>
                  <Chip label={`Risk score ${insight.score}/100`} color={severityColor[insight.severity]} variant="outlined" sx={{ alignSelf: { md: 'start' } }} />
                </Stack>
              </Paper>
            ))}
            {data.insights.length === 0 && <Alert severity="success">No supply chain risks were detected by the current rules.</Alert>}
          </Stack>
        </>
      ) : null}
    </Box>
  );
}
