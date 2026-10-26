import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';
const input = (equipmentId='EQ-01',start='10:00',end='11:00') => ({equipmentId,userId:'U-01',startAt:`2026-10-05T${start}:00Z`,endAt:`2026-10-05T${end}:00Z`});
async function fixture(t){
 const server=createApp(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 return async(path,body)=>{const r=await fetch(base+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
}
test('overlap rejected; adjacent and different equipment accepted',async t=>{
 const request=await fixture(t);
 assert.equal((await request('/reservations',input())).status,201);
 assert.equal((await request('/reservations',input('EQ-01','10:30','11:30'))).status,409);
 assert.equal((await request('/reservations',input('EQ-01','11:00','12:00'))).status,201);
 assert.equal((await request('/reservations',input('EQ-02','10:30','11:30'))).status,201);
 assert.equal((await request('/notifications')).data.length,3);
});
test('cancelled reservation frees slot; cancellation idempotent',async t=>{
 const request=await fixture(t);const first=await request('/reservations',input());
 assert.equal((await request(`/reservations/${first.data.id}/cancel`,{})).data.status,'cancelled');
 assert.equal((await request(`/reservations/${first.data.id}/cancel`,{})).status,200);
 assert.equal((await request('/reservations',input())).status,201);
});
test('invalid interval, unavailable equipment and missing record',async t=>{
 const request=await fixture(t);
 assert.equal((await request('/reservations',input('EQ-01','11:00','10:00'))).status,400);
 assert.equal((await request('/reservations',input('EQ-03'))).status,409);
 assert.equal((await request('/reservations',input('UNKNOWN'))).status,404);
 assert.equal((await request('/reservations/UNKNOWN/cancel',{})).status,404);
});
test('simultaneous identical requests: exactly one successful booking',async t=>{
 const request=await fixture(t);const results=await Promise.all(Array.from({length:10},()=>request('/reservations',input())));
 assert.equal(results.filter(r=>r.status===201).length,1);
 assert.equal(results.filter(r=>r.status===409).length,9);
});
