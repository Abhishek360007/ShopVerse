import React from 'react';
import { Edit, SaveButton, SelectInput, SimpleForm, Toolbar, useRecordContext } from 'react-admin';
import { Box, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatPrice } from '../../../utils/format';
import { STATUS_LABELS, StatusChip, paymentLabel, shortId } from './orderStatus';

const OrderTitle = () => {
  const record = useRecordContext();
  return <span>Order {record ? shortId(record.id) : ''}</span>;
};

const Detail = ({ label, children }) => (
  <Box sx={{ minWidth: 200, flex: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Typography>
    <Typography variant="body2" sx={{ mt: 0.5 }}>{children || '—'}</Typography>
  </Box>
);

const OrderSummary = () => {
  const record = useRecordContext();
  if (!record) return null;
  const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">{shortId(record.id)}</Typography>
        <StatusChip status={record.orderStatus} />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
        <Detail label="Customer">{record.customerName}<br />{record.customerEmail}</Detail>
        <Detail label="Ship to">{record.shippingAddress}<br />{record.phoneNumber}</Detail>
        <Detail label="Payment">{paymentLabel(record)}</Detail>
        <Detail label="Dates">Placed {date(record.orderDate)}<br />Expected {date(record.expectedDeliveryDate)}</Detail>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Option</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {record.items?.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6 }} />}
                  <span>{item.productName}</span>
                </Stack>
              </TableCell>
              <TableCell>{[item.size, item.color && item.color !== 'Standard' ? item.color : null].filter(Boolean).join(' · ') || '—'}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatPrice(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatPrice(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4} align="right"><strong>Order total</strong></TableCell>
            <TableCell align="right"><strong>{formatPrice(record.totalAmount)}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

const StatusInput = () => {
  const record = useRecordContext();
  if (!record) return null;
  const next = record.nextStatuses ?? [];
  if (!next.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        This order is {STATUS_LABELS[record.orderStatus]?.toLowerCase()} and can't be changed.
      </Typography>
    );
  }
  const choices = [record.orderStatus, ...next].map((id) => ({ id, name: STATUS_LABELS[id] ?? id }));
  return (
    <Box>
      <SelectInput source="orderStatus" label="Order status" choices={choices} sx={{ minWidth: 240 }} />
      <Typography variant="caption" color="text.secondary" display="block">
        Cancelling puts the items back in stock. Marking a cash-on-delivery order as delivered marks it paid.
      </Typography>
    </Box>
  );
};

const OrderToolbar = () => {
  const record = useRecordContext();
  return (
    <Toolbar>
      <SaveButton label="Update status" disabled={!record?.nextStatuses?.length} />
    </Toolbar>
  );
};

const OrderEdit = () => (
  <Edit title={<OrderTitle />} mutationMode="pessimistic" actions={false}>
    <SimpleForm toolbar={<OrderToolbar />}>
      <OrderSummary />
      <StatusInput />
    </SimpleForm>
  </Edit>
);

export default OrderEdit;
