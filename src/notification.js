// Local synchronous notification log; no external mail service.
export function createNotificationService() {
  const records = [];
  return {
    notify(reservationId) {
      records.push({ id: `N-${records.length + 1}`, reservationId, status: 'sent' });
    },
    list() { return records.map(n => ({ ...n })); },
  };
}
