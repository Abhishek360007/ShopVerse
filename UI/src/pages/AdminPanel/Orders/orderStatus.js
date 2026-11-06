import React from 'react';
import { Chip } from '@mui/material';

export const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'default',
};

export const statusChoices = Object.entries(STATUS_LABELS).map(([id, name]) => ({ id, name }));

export const paymentLabel = (record) => {
  const method = record?.paymentMethod === 'COD' ? 'Cash on delivery' : 'Card';
  const status = record?.paymentStatus === 'COMPLETED' ? 'paid' : record?.paymentStatus === 'FAILED' ? 'failed' : 'unpaid';
  return `${method} · ${status}`;
};

export const shortId = (id) => `#${String(id ?? '').slice(0, 8).toUpperCase()}`;

export const StatusChip = ({ status }) => (
  <Chip size="small" label={STATUS_LABELS[status] ?? status} color={STATUS_COLORS[status] ?? 'default'}
        variant={status === 'CANCELLED' ? 'outlined' : 'filled'} />
);
