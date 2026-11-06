import { buildTimeline } from './tracking';

describe('buildTimeline', () => {
  it('marks steps up to the current status as done, with their times', () => {
    const rows = buildTimeline({
      orderStatus: 'SHIPPED',
      statusHistory: [
        { status: 'PENDING', at: '2026-11-01T10:00:00Z' },
        { status: 'CONFIRMED', at: '2026-11-01T11:00:00Z' },
        { status: 'SHIPPED', at: '2026-11-02T09:00:00Z' },
      ],
    });
    expect(rows.map((r) => r.status)).toEqual(['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    expect(rows.map((r) => r.done)).toEqual([true, true, true, true, false, false]);
    expect(rows.find((r) => r.current).status).toBe('SHIPPED');
    expect(rows[2].at).toBeNull();          // skipped step: done, no time
    expect(rows[3].at).toBe('2026-11-02T09:00:00Z');
  });

  it('ends a cancelled order at the cancellation', () => {
    const rows = buildTimeline({
      orderStatus: 'CANCELLED',
      statusHistory: [{ status: 'PENDING', at: 'a' }, { status: 'CANCELLED', at: 'b', note: 'Cancelled by you' }],
    });
    expect(rows.map((r) => r.status)).toEqual(['PENDING', 'CANCELLED']);
    expect(rows[1].description).toBe('Cancelled by you');
  });
});
