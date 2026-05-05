const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Activity = require('./models/Activity');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

async function findReadersById() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Search by bookId (103)
    const activities = await Activity.find({ bookId: 103 }).lean();
    console.log(`Found ${activities.length} activity records for bookId 103`);

    for (const a of activities) {
      const user = await User.findById(a.user).lean();
      console.log(`User: ${user ? user.name : 'Unknown'}, ID: ${a.user}, Progress: ${a.pageNumber}/${a.totalPages}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findReadersById();
