const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elibrary').then(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Admin@1234', salt);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'bharanamihijaya@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');
  console.log('Password reset to: Admin@1234');
  mongoose.disconnect();
});
