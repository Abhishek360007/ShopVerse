import React, { useEffect, useState } from 'react';
import { Link, Title, useGetList } from 'react-admin';
import {
  Box, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { formatPrice } from '../../utils/format';
import { StatusChip, shortId } from './Orders/orderStatus';
import SalesChart, { SalesTable } from './SalesChart';

const Panel = ({ title, action, children, sx }) => (
  <Card sx={{ height: '100%', ...sx }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, minHeight: 32 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </CardContent>
  </Card>
);

const Kpi = ({ label, value, hint }) => (
  <Card sx={{ flex: '1 1 170px' }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
      {hint && <Box sx={{ mt: 0.5 }}>{hint}</Box>}
    </CardContent>
  </Card>
);

/** "▲ 12% vs last month" — arrow + words carry the meaning, colour only reinforces it. */
const Change = ({ percent }) => {
  if (percent === null || percent === undefined) {
    return <Typography variant="caption" color="text.secondary">No sales last month to compare</Typography>;
  }
  const up = percent >= 0;
  const shown = Math.abs(percent) >= 10 ? Math.round(percent) : percent.toFixed(1);
  return (
    <Stack direction="row" alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
      {up ? <ArrowDropUpIcon fontSize="small" color="success" /> : <ArrowDropDownIcon fontSize="small" color="error" />}
      <Typography variant="caption" color={up ? 'success.main' : 'error.main'} sx={{ fontWeight: 700 }}>
        {up ? '+' : ''}{shown}%
      </Typography>
      <Typography variant="caption" color="text.secondary">&nbsp;vs last month</Typography>
    </Stack>
  );
};

const Dashboard = ({ fetchAnalytics }) => {
  const [months, setMonths] = useState(6);
  const [view, setView] = useState('chart');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { data: recent = [] } = useGetList('orders', { pagination: { page: 1, perPage: 5 } });

  useEffect(() => {
    setError('');
    fetchAnalytics(months).then(setData).catch(() => setError('Could not load store analytics.'));
  }, [fetchAnalytics, months]);

  const k = data?.kpis;
  const c = data?.customers;
  const repeatRate = c?.payingCustomers ? Math.round((c.repeatCustomers / c.payingCustomers) * 100) : 0;

  return (
    <Box sx={{ py: 2 }}>
      <Title title="ShopVerse admin" />
      <Typography variant="h5" sx={{ fontWeight: 800 }}>Store overview</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sales, products and customers at a glance. Revenue excludes cancelled orders.</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* KPIs */}
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
        <Kpi label="Revenue" value={k ? formatPrice(k.revenue) : '…'}
             hint={k && <><Typography variant="caption" color="text.secondary" display="block">This month {formatPrice(k.revenueThisMonth)}</Typography><Change percent={k.revenueChangePercent} /></>} />
        <Kpi label="Orders" value={k?.orders ?? '…'}
             hint={k && <Typography variant="caption" color="text.secondary">Avg {formatPrice(k.averageOrderValue)} · {k.ordersThisMonth} this month</Typography>} />
        <Kpi label="To ship" value={k?.toShip ?? '…'}
             hint={<Typography variant="caption" color="text.secondary">Placed, confirmed or packed</Typography>} />
        <Kpi label="Customers" value={c?.totalCustomers ?? '…'}
             hint={c && <Typography variant="caption" color="text.secondary">+{c.newThisMonth} new this month</Typography>} />
        <Kpi label="Repeat customers" value={c ? `${repeatRate}%` : '…'}
             hint={c && <Typography variant="caption" color="text.secondary">{c.repeatCustomers} of {c.payingCustomers} buyers ordered again</Typography>} />
        <Kpi label="Low stock" value={k?.lowStockCount ?? '…'}
             hint={<Typography variant="caption" color="text.secondary">Options with 5 or fewer left</Typography>} />
      </Stack>

      {/* Sales chart + best sellers */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, mb: 2 }}>
        <Panel
          title="Monthly sales"
          action={
            <Stack direction="row" spacing={1}>
              <ToggleButtonGroup size="small" exclusive value={months} onChange={(e, v) => v && setMonths(v)} aria-label="Time range">
                <ToggleButton value={6}>6 months</ToggleButton>
                <ToggleButton value={12}>12 months</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup size="small" exclusive value={view} onChange={(e, v) => v && setView(v)} aria-label="View">
                <ToggleButton value="chart">Chart</ToggleButton>
                <ToggleButton value="table">Table</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          }>
          {!data ? <Box sx={{ height: 240 }} /> : view === 'chart' ? <SalesChart data={data.monthly} /> : <SalesTable data={data.monthly} />}
        </Panel>

        <Panel title="Best sellers">
          {!data?.bestSellers?.length ? (
            <Typography variant="body2" color="text.secondary">No sales yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Sold</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.bestSellers.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: 36, height: 30, objectFit: 'cover', borderRadius: 6 }} />}
                        <span>{p.name}</span>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{p.unitsSold}</TableCell>
                    <TableCell align="right">{formatPrice(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </Box>

      {/* Low stock, customers, recent orders */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1.3fr' } }}>
        <Panel title="Low-stock alerts" action={<Link to="/products">Products</Link>}>
          {!data?.lowStock?.length ? (
            <Typography variant="body2" color="text.secondary">Everything is well stocked.</Typography>
          ) : (
            <Stack spacing={1}>
              {data.lowStock.map((v, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1}>
                  <WarningAmberIcon fontSize="small" color={v.stock === 0 ? 'error' : 'warning'} />
                  <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                    {v.productName}{v.size && v.size !== 'One Size' ? ` · ${v.size}` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} color={v.stock === 0 ? 'error.main' : 'warning.main'}>
                    {v.stock === 0 ? 'Out of stock' : `${v.stock} left`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Panel>

        <Panel title="Top customers">
          {!c?.topCustomers?.length ? (
            <Typography variant="body2" color="text.secondary">No customer orders yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">Spent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {c.topCustomers.map((t) => (
                  <TableRow key={t.email}>
                    <TableCell>
                      <Typography variant="body2">{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.email}</Typography>
                    </TableCell>
                    <TableCell align="right">{t.orders}</TableCell>
                    <TableCell align="right">{formatPrice(t.spent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="Recent orders" action={<Link to="/orders">View all</Link>}>
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
        </Panel>
      </Box>
    </Box>
  );
};

export default Dashboard;
