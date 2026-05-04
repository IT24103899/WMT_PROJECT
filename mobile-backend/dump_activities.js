const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Activity = require('./models/Activity');

dotenv.config({ path: path.join(__dirname, '.env') });

async function dumpActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const activities = await Activity.find({}).sort('-lastReadAt').limit(20).lean();
    console.log('--- All Activities ---');
    activities.forEach(a => {
      console.log(`User: ${a.user}, BookId: ${a.bookId} (${typeof a.bookId}), Progress: ${a.pageNumber}/${a.totalPages}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dumpActivities();
