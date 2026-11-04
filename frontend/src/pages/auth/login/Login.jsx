import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  Container,
  FormHelperText,
} from '@mui/material';
import CustomButton from '@components/CustomButton';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '@services/auth.service';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [demoAccount, setDemoAccount] = useState('custom');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // This picker is only a shortcut for the seeded demo accounts. The API always
  // derives permissions from the role stored against the authenticated account.
  const demoAccounts = [
    { value: 'admin', label: 'Administrator', email: 'seed-admin-01@warehouse.demo' },
    { value: 'manager', label: 'Manager', email: 'seed-manager-01@warehouse.demo' },
    { value: 'warehouse', label: 'Warehouse staff', email: 'seed-warehouse-01@warehouse.demo' },
    { value: 'procurement', label: 'Procurement', email: 'seed-procurement-01@warehouse.demo' },
    { value: 'sales', label: 'Sales', email: 'seed-sales-01@warehouse.demo' },
    { value: 'logistics', label: 'Logistics', email: 'seed-logistics-01@warehouse.demo' },
    { value: 'analyst', label: 'Analyst', email: 'seed-analyst-01@warehouse.demo' },
    { value: 'partner', label: 'Partner', email: 'seed-partner-01@warehouse.demo' },
  ];

  const handleDemoAccountChange = (e) => {
    const selected = e.target.value;
    setDemoAccount(selected);
    const account = demoAccounts.find((item) => item.value === selected);
    if (account) {
      setFormData({ email: account.email, password: 'DemoPass123!' });
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    await AuthService.login(formData)
      .then(() => {
        navigate('/warehouse');
      })
      .catch((error) => {
        setErrors({ general: error.message || 'Login failed' });
      });
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#ffffff',
          p: 4,
          borderRadius: 2,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: '#7f408e', mb: 4, fontFamily: 'Roboto, sans-serif' }}
        >
          Login
        </Typography>
        {errors.general && (
          <FormHelperText error sx={{ mb: 2 }}>
            {errors.general}
          </FormHelperText>
        )}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 1 }}>
            <InputLabel id="demo-role-label">Demo login as</InputLabel>
            <Select
              labelId="demo-role-label"
              id="demo-role"
              value={demoAccount}
              label="Demo login as"
              onChange={handleDemoAccountChange}
            >
              <MenuItem value="custom">Use my own account</MenuItem>
              {demoAccounts.map((account) => (
                <MenuItem key={account.value} value={account.value}>
                  {account.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              A role is assigned by the account; this only fills a demo account.
            </FormHelperText>
          </FormControl>
          <FormControl
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            error={!!errors.email}
          >
            <InputLabel htmlFor="email">Email</InputLabel>
            <OutlinedInput
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setDemoAccount('custom');
                handleChange(e);
              }}
              label="Email"
            />
            <FormHelperText>{errors.email}</FormHelperText>
          </FormControl>
          <FormControl
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            error={!!errors.password}
          >
            <InputLabel htmlFor="password">Password</InputLabel>
            <OutlinedInput
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setDemoAccount('custom');
                handleChange(e);
              }}
              label="Password"
            />
            <FormHelperText>{errors.password}</FormHelperText>
          </FormControl>
          <CustomButton
            type="submit"
            variant="contained"
            color="primary"
            label="Login"
            fullWidth
            sx={{ mt: 2 }}
          />
        </form>
        <Typography
          variant="body2"
          sx={{ mt: 2, color: '#3e468a', fontFamily: 'Roboto, sans-serif' }}
        >
          Don’t have an account?{' '}
          <Link
            to="/signup"
            style={{ color: '#ff7b47', textDecoration: 'none' }}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
