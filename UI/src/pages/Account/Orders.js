import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import moment from 'moment';
import { setLoading } from '../../store/features/common';
import { cancelOrderAPI, fetchOrderAPI } from '../../api/userInfo';
import { cancelOrder, loadOrders, selectAllOrders } from '../../store/features/user';
import Timeline from '../../components/Timeline/Timeline';
import { STATUS_LABELS, getStepCount, orderGroup } from '../../utils/order-util';
import { formatPrice } from '../../utils/format';

const filters = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const Orders = () => {
  const dispatch = useDispatch();
  const allOrders = useSelector(selectAllOrders);
  const [filter, setFilter] = useState('ACTIVE');
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(setLoading(true));
    fetchOrderAPI().then(res => dispatch(loadOrders(res)))
      .catch(() => setError('We could not load your orders.'))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  const orders = useMemo(() =>
    [...(allOrders ?? [])]
      .sort((a, b) => new Date(b?.orderDate) - new Date(a?.orderDate))
      .filter((order) => orderGroup(order?.orderStatus) === filter),
  [allOrders, filter]);

  const onCancel = (id) => {
    dispatch(setLoading(true));
    cancelOrderAPI(id).then(() => dispatch(cancelOrder(id)))
      .catch(() => setError('This order can no longer be cancelled.'))
      .finally(() => dispatch(setLoading(false)));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">My orders</h2>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button key={f.value} type="button" onClick={() => setFilter(f.value)}
                    className={`chip py-1.5 ${filter === f.value ? 'chip-active' : ''}`}>{f.label}</button>
          ))}
        </div>
      </div>
      {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}

      {!orders.length ? (
        <div className="mt-8 text-center">
          <p className="text-muted">No {filter.toLowerCase()} orders.</p>
          <Link to="/" className="btn-primary mt-4">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const step = getStepCount[order?.orderStatus];
            const items = order?.orderItemList ?? [];
            return (
              <li key={order.id} className="rounded-2xl border border-line bg-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">Order #{String(order.id).slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted">Placed {moment(order?.orderDate).format('D MMM YYYY')}
                      {order?.expectedDeliveryDate && orderGroup(order.orderStatus) === 'ACTIVE' &&
                        <> · Arrives by {moment(order.expectedDeliveryDate).format('D MMM YYYY')}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatPrice(order?.totalAmount)}</p>
                    <p className="text-xs text-muted">{STATUS_LABELS[order?.orderStatus] ?? order?.orderStatus}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {items.slice(0, 4).map((item) => (
                    <img key={item?.id} src={item?.product?.resources?.[0]?.url} alt={item?.product?.name}
                         className="h-11 w-12 rounded-lg object-cover" />
                  ))}
                  {items.length > 4 && <span className="text-xs text-muted">+{items.length - 4} more</span>}
                </div>

                {step && <Timeline stepCount={step} />}

                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to={`/account-details/orders/${order.id}`} className="btn-primary h-9 px-4">Track order</Link>
                  {order?.cancellable && (
                    <button type="button" onClick={() => onCancel(order.id)} className="btn-ghost h-9 px-4 text-red-500">Cancel</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  )
}

export default Orders
