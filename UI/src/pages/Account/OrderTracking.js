import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import { cancelOrderAPI, fetchOrderByIdAPI } from '../../api/userInfo';
import { setLoading, showToast } from '../../store/features/common';
import { STATUS_LABELS } from '../../utils/order-util';
import { buildTimeline } from '../../utils/tracking';
import { formatPrice } from '../../utils/format';
import { ArrowLeftIcon, CheckCircleIcon, CheckIcon, PackageIcon, TruckIcon } from '../../components/common/Icons';

const when = (date) => (date ? moment(date).format('D MMM, h:mm A') : null);

const OrderTracking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(setLoading(true));
    fetchOrderByIdAPI(id).then(setOrder)
      .catch(() => setError('We could not find this order.'))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch, id]);

  const onCancel = () => {
    dispatch(setLoading(true));
    cancelOrderAPI(id)
      .then(() => fetchOrderByIdAPI(id)).then((res) => { setOrder(res); dispatch(showToast('Your order has been cancelled')); })
      .catch(() => setError('This order can no longer be cancelled.'))
      .finally(() => dispatch(setLoading(false)));
  };

  if (error && !order) {
    return (
      <div className="text-center">
        <p className="text-muted">{error}</p>
        <Link to="/account-details/orders" className="btn-primary mt-4">Back to my orders</Link>
      </div>
    );
  }
  if (!order) return <div className="h-64 animate-pulse rounded-2xl bg-raised" />;

  const rows = buildTimeline(order);
  const cancelled = order.orderStatus === 'CANCELLED';
  const delivered = order.orderStatus === 'DELIVERED';
  const itemCount = order.orderItemList?.reduce((n, i) => n + (i?.quantity ?? 0), 0) ?? 0;

  return (
    <div>
      <Link to="/account-details/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon className="h-4 w-4" /> My orders
      </Link>

      <h2 className="mt-3 text-2xl font-extrabold">Track order #{String(order.id).slice(0, 8).toUpperCase()}</h2>
      <p className="mt-1 text-sm text-muted">
        Placed {moment(order.orderDate).format('ddd, D MMM YYYY')} · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(order.totalAmount)}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-2xl p-4 ${cancelled ? 'bg-fg/5' : 'bg-emerald-500/10'}`}>
          <p className="flex items-center gap-2 text-sm text-muted"><PackageIcon className="h-4 w-4" /> Status</p>
          <p className="mt-1 text-lg font-extrabold">{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</p>
        </div>
        <div className="rounded-2xl bg-brand-purple/10 p-4">
          <p className="flex items-center gap-2 text-sm text-muted"><TruckIcon className="h-4 w-4" />
            {delivered ? 'Delivered on' : 'Estimated delivery'}</p>
          <p className="mt-1 text-lg font-extrabold">
            {cancelled ? '—' : moment(delivered ? rows[rows.length - 1].at || order.expectedDeliveryDate : order.expectedDeliveryDate).format('D MMM YYYY')}
          </p>
        </div>
      </div>

      {order.shipmentNumber && (
        <p className="mt-3 text-sm text-muted">Tracking number: <span className="font-semibold text-fg">{order.shipmentNumber}</span></p>
      )}

      <h3 className="mt-7 text-lg font-extrabold">Tracking details</h3>
      <ol className="mt-4">
        {rows.map((row, index) => {
          const last = index === rows.length - 1;
          return (
            <li key={row.status} className="relative flex gap-4 pb-7 last:pb-0">
              {!last && (
                <span aria-hidden="true"
                      className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${rows[index + 1].done ? 'bg-emerald-500' : 'bg-fg/15'}`} />
              )}
              <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                row.cancelled ? 'bg-fg/20 text-fg' : row.done ? 'bg-emerald-500 text-white' : 'border-2 border-fg/20 bg-surface text-transparent'}`}>
                {row.cancelled ? <span className="text-sm font-bold">×</span> : <CheckIcon className="h-4 w-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div>
                  <p className={`font-semibold ${row.done ? '' : 'text-muted'}`}>
                    {row.label}{row.current && !delivered && <span className="ml-2 rounded-full bg-brand-purple/15 px-2 py-0.5 text-xs text-brand-purple">Current</span>}
                  </p>
                  <p className="text-sm text-muted">{row.description}</p>
                </div>
                <p className="text-sm text-muted">
                  {row.at ? when(row.at) : row.status === 'DELIVERED' && !row.done ? `Expected ${moment(order.expectedDeliveryDate).format('D MMM')}` : ''}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <h3 className="mt-8 text-lg font-extrabold">Items</h3>
      <ul className="mt-3 space-y-2">
        {order.orderItemList?.map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <img src={item?.product?.resources?.[0]?.url} alt="" className="h-12 w-14 rounded-lg object-cover" />
            <Link to={`/product/${item?.product?.slug}`} className="min-w-0 flex-1 truncate hover:text-brand-pink">{item?.product?.name}</Link>
            <span className="text-muted">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {order.address && (
        <p className="mt-6 text-sm text-muted">
          Delivering to <span className="text-fg">{order.address.name}</span>, {order.address.street}, {order.address.city}, {order.address.state} {order.address.zipCode}
        </p>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}
      {order.cancellable && (
        <button type="button" onClick={onCancel} className="btn-ghost mt-6 text-red-500">Cancel order</button>
      )}
      {delivered && (
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-500">
          <CheckCircleIcon className="h-5 w-5" /> Delivered. Thank you for shopping with ShopVerse!
        </p>
      )}
    </div>
  );
};

export default OrderTracking;
