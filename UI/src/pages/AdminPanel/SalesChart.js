import React, { useMemo, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { formatPrice } from '../../utils/format';

// Rupee labels in one style per axis: in full below ₹10,000, otherwise compact (₹2.5K, ₹1.2L)
const formatter = (axisTop) => (value) => {
  if (value === 0) return '₹0';
  if (axisTop >= 1000000) return `₹${+(value / 100000).toFixed(1)}L`;
  if (axisTop >= 10000) return `₹${+(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

// Round the axis top up to a clean step so ticks read 0 / 2K / 4K ...
const niceTicks = (max, count = 4) => {
  if (max <= 0) return [0, 1000, 2000, 3000, 4000];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
};

/**
 * Monthly revenue as a single-series column chart (one axis; order counts live in the
 * tooltip and the table view rather than on a second axis).
 */
const SalesChart = ({ data = [], height = 240 }) => {
  const theme = useTheme();
  const [hover, setHover] = useState(null);
  const width = 640;
  const pad = { top: 24, right: 8, bottom: 28, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const ticks = useMemo(() => niceTicks(Math.max(0, ...data.map((d) => d.revenue))), [data]);
  const top = ticks[ticks.length - 1];
  const compact = formatter(top);
  const band = data.length ? plotW / data.length : plotW;
  const barW = Math.min(24, band * 0.55);
  const y = (v) => pad.top + plotH - (v / top) * plotH;
  const latest = data.length - 1;

  const color = theme.palette.primary.main;
  const grid = theme.palette.divider;
  const ink = theme.palette.text.secondary;

  // 4px rounded top, square at the baseline
  const barPath = (x, value) => {
    const h = Math.max((value / top) * plotH, value > 0 ? 2 : 0);
    if (h === 0) return '';
    const r = Math.min(4, h, barW / 2);
    const yTop = pad.top + plotH - h;
    const base = pad.top + plotH;
    return `M${x},${base} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${base} Z`;
  };

  return (
    <Box sx={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img"
           aria-label={`Monthly revenue: ${data.map((d) => `${d.label} ${formatPrice(d.revenue)}`).join(', ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={grid} strokeWidth="1" />
            <text x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill={ink}>{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * band + (band - barW) / 2;
          const active = hover === i;
          return (
            <g key={d.month}>
              <path d={barPath(x, d.revenue)} fill={color} opacity={hover === null || active ? 1 : 0.55} />
              <text x={pad.left + i * band + band / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={ink}>
                {d.label.split(' ')[0]}
              </text>
              {i === latest && d.revenue > 0 && (
                <text x={x + barW / 2} y={y(d.revenue) - 6} textAnchor="middle" fontSize="11" fontWeight="600"
                      fill={theme.palette.text.primary}>{compact(d.revenue)}</text>
              )}
              {/* hit target: the whole column band, larger than the bar */}
              <rect x={pad.left + i * band} y={pad.top} width={band} height={plotH} fill="transparent"
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}
                    aria-label={`${d.label}: ${formatPrice(d.revenue)}, ${d.orders} orders`} />
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <Box sx={{
          position: 'absolute', pointerEvents: 'none', top: 0,
          left: `${((pad.left + hover * band + band / 2) / width) * 100}%`, transform: 'translateX(-50%)',
          bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1, boxShadow: 4,
          whiteSpace: 'nowrap',
        }}>
          <Typography variant="caption" color="text.secondary">{data[hover].label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatPrice(data[hover].revenue)}</Typography>
          <Typography variant="caption" color="text.secondary">{data[hover].orders} orders</Typography>
        </Box>
      )}
    </Box>
  );
};

export const SalesTable = ({ data = [] }) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Month</TableCell>
        <TableCell align="right">Orders</TableCell>
        <TableCell align="right">Revenue</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((d) => (
        <TableRow key={d.month}>
          <TableCell>{d.label}</TableCell>
          <TableCell align="right">{d.orders}</TableCell>
          <TableCell align="right">{formatPrice(d.revenue)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default SalesChart;
