import React from 'react';
import { Datagrid, DateField, FunctionField, List, NumberField, SelectInput, TextField } from 'react-admin';
import { formatPrice } from '../../../utils/format';
import { StatusChip, paymentLabel, shortId, statusChoices } from './orderStatus';

const orderFilters = [
  <SelectInput key="status" source="orderStatus" label="Status" choices={statusChoices} alwaysOn emptyText="All orders" />,
];

const OrderList = () => (
  <List filters={orderFilters} exporter={false} perPage={25} title="Orders">
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField label="Order" sortable={false} render={(r) => shortId(r.id)} />
      <DateField source="orderDate" label="Placed" showTime sortable={false} />
      <TextField source="customerName" label="Customer" sortable={false} emptyText="—" />
      <NumberField source="itemCount" label="Items" sortable={false} />
      <FunctionField label="Total" sortable={false} render={(r) => formatPrice(r.totalAmount)} />
      <FunctionField label="Payment" sortable={false} render={paymentLabel} />
      <FunctionField label="Status" sortable={false} render={(r) => <StatusChip status={r.orderStatus} />} />
    </Datagrid>
  </List>
);

export default OrderList;
