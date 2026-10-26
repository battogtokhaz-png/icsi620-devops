export class DomainError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const fail = (status, code, message) => { throw new DomainError(status, code, message); };
// Require ISO timestamp with explicit timezone, rather than locale-specific input.
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
  return Date.parse(value);
}
export function createBookingService({ getEquipment, notification }) {
  const reservations = [];
  return {
    list() { return reservations.map(r => ({ ...r })); },
    create(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'INVALID_INPUT', 'Object required');
      const { equipmentId, userId, startAt, endAt } = input;
      if (typeof equipmentId !== 'string' || typeof userId !== 'string' || !userId.trim())
        fail(400, 'INVALID_INPUT', 'equipmentId and userId required');
      const start = timestamp(startAt), end = timestamp(endAt);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
        fail(400, 'INVALID_TIME', 'Use ISO timestamps with timezone; start must precede end');
      const equipment = getEquipment(equipmentId);
      if (!equipment) fail(404, 'EQUIPMENT_NOT_FOUND', 'Equipment not found');
      if (equipment.status !== 'available') fail(409, 'EQUIPMENT_UNAVAILABLE', 'Equipment unavailable');
      const conflict = reservations.some(r => r.equipmentId === equipmentId && r.status === 'active'
        && start <= Date.parse(r.endAt) && Date.parse(r.startAt) < end);
      if (conflict) fail(409, 'RESERVATION_CONFLICT', 'Time slot overlaps');
      const reservation = { id: `R-${reservations.length + 1}`, equipmentId, userId,
        startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(), status: 'active' };
      // No await between check and insert: one-process in-memory baseline only.
      reservations.push(reservation);
      // Booking succeeds even if notification fails. No retry in this baseline.
      try { notification.notify(reservation.id); }
      catch (error) { console.error('Notification failed:', error.message); }
      return { ...reservation };
    },
    cancel(id) {
      const r = reservations.find(r => r.id === id);
      if (!r) fail(404, 'RESERVATION_NOT_FOUND', 'Reservation not found');
      r.status = 'cancelled';
      return { ...r }; // Repeated cancellation is idempotent.
    },
  };
}
