import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUrl = process.env.MONGODB_URL;
if (!mongoUrl) throw new Error('MONGODB_URL is missing from backend/.env');

const client = new MongoClient(mongoUrl);

async function print(title: string, result: unknown) {
  console.log(`\n--- ${title} ---`);
  console.dir(result, { depth: null, colors: true });
}

async function main() {
  await client.connect();
  const db = client.db();

  await print('1. All alerts', await db.collection('alerts').find({}).toArray());
  await print('2. Unread alerts', await db.collection('alerts').find({ isRead: false }).toArray());
  await print('3. Critical alerts', await db.collection('alerts').find({ severity: 'CRITICAL' }).toArray());
  await print(
    '4. Alert count grouped by type',
    await db.collection('alerts').aggregate([
      { $group: { _id: '$type', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]).toArray(),
  );
  await print(
    '5. Newest alerts (selected fields)',
    await db.collection('alerts')
      .find({}, { projection: { _id: 0, type: 1, severity: 1, message: 1, isRead: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
