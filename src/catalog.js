const equipment = [
  { id: 'EQ-01', name: 'Осциллограф', status: 'available' },
  { id: 'EQ-02', name: 'Мультиметр', status: 'available' },
  { id: 'EQ-03', name: 'Сигнал үүсгэгч', status: 'unavailable' },
];
export function listEquipment() { return equipment.map(e => ({ ...e })); }
export function getEquipment(id) { return equipment.find(e => e.id === id); }
