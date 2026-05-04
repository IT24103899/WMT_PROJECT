const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/elibrary_mobile';
const ATLAS_URI = 'mongodb+srv://bharanamihijaya_db_user:2004Bharana@cluster0.kpgbt3i.mongodb.net/elibrary_mobile?appName=Cluster0';

async function migrate() {
  console.log('Connecting to local database...');
  const localDb = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected locally.');

  console.log('Connecting to Atlas database...');
  const atlasDb = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('Connected to Atlas.');

  // Get all collections from local DB
  const collections = await localDb.db.listCollections().toArray();
  
  for (const collInfo of collections) {
    const collName = collInfo.name;
    console.log(`\nMigrating collection: ${collName}`);
    
    // Fetch all documents from local collection
    const docs = await localDb.collection(collName).find({}).toArray();
    console.log(`Found ${docs.length} documents in local '${collName}'.`);
    
    if (docs.length > 0) {
      // Insert into Atlas collection
      try {
        await atlasDb.collection(collName).insertMany(docs);
        console.log(`Successfully inserted ${docs.length} documents into Atlas '${collName}'.`);
      } catch (err) {
        if (err.code === 11000) {
          console.log(`Documents already exist in Atlas '${collName}' (Duplicate Key Error). Skipping.`);
        } else {
          console.error(`Error inserting into '${collName}':`, err.message);
        }
      }
    }
  }

  console.log('\nMigration complete!');
  await localDb.close();
  await atlasDb.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
