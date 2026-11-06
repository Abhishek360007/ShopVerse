import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import moment from 'moment';
import { setLoading } from '../../store/features/common';
import { cancelOrderAPI, fetchOrderAPI } from '../../api/userInfo';
import { cancelOrder, loadOrders, selectAllOrders } from '../../store/features/user';
import Timeline from '../../components/Timeline/Timeline';
import { getStepCount } from '../../utils/order-util';
import { formatPrice } from '../../utils/format';

const filters = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const groupOf = (status) =>
  ['PENDING', 'IN_PROGRESS', 'SHIPPED'].includes(status) ? 'ACTIVE' : status === 'DELIVERED' ? 'COMPLETED' : status;

const statusLabel = (status) => (status ?? '').replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const Orders = () => {
  const dispatch = useDispatch();
  const allOrders = useSelector(selectAllOrders);
  const [filter, setFilter] = useState('ACTIVE');
  const [openId, setOpenId] = useState('');
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
      .filter((order) => groupOf(order?.orderStatus) === filter),
  [allOrders, filter]);

  const onCancel = (id) => {
    dispatch(setLoading(true));
    cancelOrderAPI(id).then(() => dispatch(cancelOrder(id)))
      .catch(() => setError('This order could not be cancelled.'))
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
      {error && <p className="mt-4 text-sm font-semibold text-red-400">{error}</p>}

      {!orders.length ? (
        <div className="mt-8 text-center">
          <p className="text-muted">No {filter.toLowerCase()} orders.</p>
          <Link to="/" className="btn-primary mt-4">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const open = openId === order.id;
            const step = getStepCount[order?.orderStatus];
            return (
              <li key={order.id} className="rounded-2xl border border-line bg-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">Order #{String(order.id).slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted">Placed {moment(order?.orderDate).format('D MMM YYYY')}
                      {order?.expectedDeliveryDate && groupOf(order.orderStatus) === 'ACTIVE' &&
                        <> · Arrives by {moment(order.expectedDeliveryDate).format('D MMM YYYY')}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatPrice(order?.totalAmount)}</p>
                    <p className="text-xs text-muted">{statusLabel(order?.orderStatus)}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setOpenId(open ? '' : order.id)}
                        className="mt-3 text-sm font-semibold text-brand-pink hover:underline">
                  {open ? 'Hide details' : 'View details'}
                </button>

                {open && (
                  <div className="mt-3 border-t border-line pt-3">
                    {order?.orderStatus !== 'CANCELLED' && step && <Timeline stepCount={step} />}
                    <ul className="space-y-2">
                      {order?.orderItemList?.map((item) => (
                        <li key={item?.id} className="flex items-center gap-3 text-sm">
                          <img src={item?.product?.resources?.[0]?.url} alt="" className="h-12 w-14 rounded-lg object-cover" />
                          <span className="min-w-0 flex-1 truncate">{item?.product?.name}</span>
                          <span className="text-muted">× {item?.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    {step && step <= 2 && (
                      <button type="button" onClick={() => onCancel(order.id)} className="btn-ghost mt-4 h-9 text-red-300">
                        Cancel order
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  )
}

export default Orders
