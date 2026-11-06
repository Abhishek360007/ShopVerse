import React, { useEffect, useState } from 'react';
import { Link, Title, useGetList } from 'react-admin';
import { Box, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatPrice } from '../../utils/format';
import { StatusChip, shortId } from './Orders/orderStatus';

const Stat = ({ label, value, hint }) => (
  <Card sx={{ flex: '1 1 180px' }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </CardContent>
  </Card>
);

const Dashboard = ({ fetchStats }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const { data: recent = [] } = useGetList('orders', { pagination: { page: 1, perPage: 5 } });

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setError('Could not load sales figures.'));
  }, [fetchStats]);

  return (
    <Box sx={{ py: 2 }}>
      <Title title="ShopVerse admin" />
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Store overview</Typography>
      {error && <Typography color="error">{error}</Typography>}

      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Stat label="Revenue" value={stats ? formatPrice(stats.revenue) : '…'} hint="Excludes cancelled orders" />
        <Stat label="Orders" value={stats?.totalOrders ?? '…'} hint={stats ? `Avg ${formatPrice(stats.averageOrderValue)}` : ''} />
        <Stat label="To ship" value={stats?.toShip ?? '…'} hint="Pending or in progress" />
        <Stat label="Shipped" value={stats?.shipped ?? '…'} />
        <Stat label="Delivered" value={stats?.delivered ?? '…'} />
        <Stat label="Cancelled" value={stats?.cancelled ?? '…'} />
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Recent orders</Typography>
            <Link to="/orders">View all</Link>
          </Stack>
          {recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No orders yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell><Link to={`/orders/${order.id}`}>{shortId(order.id)}</Link></TableCell>
                    <TableCell>{order.customerName || order.customerEmail}</TableCell>
                    <TableCell align="right">{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell><StatusChip status={order.orderStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
