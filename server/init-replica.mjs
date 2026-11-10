import { MongoClient } from 'mongodb';

const c = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true');
await c.connect();
try {
  const r = await c.db('admin').command({
    replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] },
  });
  console.log('OK:', r.ok);
} catch (e) {
  console.log('Mensaje:', e.message);
}
await c.close();