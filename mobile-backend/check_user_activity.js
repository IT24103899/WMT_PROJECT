const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Activity = require('./models/Activity');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUserActivity() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ name: /Mahela/i });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    console.log(`User Found: ${user.name} (${user._id})`);

    const activities = await Activity.find({ user: user._id }).sort('-lastReadAt').lean();
    console.log('--- User Activities ---');
    activities.forEach(a => {
      console.log(`BookId: ${a.bookId}`);
      console.log(`Title (stored): ${a.title}`);
      console.log(`Last Read: ${a.lastReadAt}`);
      console.log('------------------------');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUserActivity();
