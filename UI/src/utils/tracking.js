import { ORDER_STEPS, getStepCount } from './order-util';

/** Builds the timeline rows: each delivery step with its time, or a cancelled branch. */
export const buildTimeline = (order) => {
  const history = order?.statusHistory ?? [];
  const timeOf = (status) => history.find((h) => h.status === status)?.at ?? null;

  if (order?.orderStatus === 'CANCELLED') {
    const reached = history.filter((h) => h.status !== 'CANCELLED').map((h) => h.status);
    const steps = ORDER_STEPS.filter((s) => s.status === 'PENDING' || reached.includes(s.status))
      .map((s) => ({ ...s, done: true, at: timeOf(s.status) }));
    const cancelled = history.find((h) => h.status === 'CANCELLED');
    return [...steps, { status: 'CANCELLED', label: 'Cancelled', description: cancelled?.note || 'This order was cancelled.', done: true, cancelled: true, at: cancelled?.at }];
  }

  const current = getStepCount[order?.orderStatus] ?? 1;
  return ORDER_STEPS.map((step, index) => ({
    ...step,
    done: index < current,
    current: index === current - 1,
    at: timeOf(step.status),
  }));
};
