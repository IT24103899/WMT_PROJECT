const mongoose = require('mongoose');
const User = require('./models/User');

const testUsers = [
  { name: "Admin User", email: "admin@elibrary.com", password: "admin123", role: "admin" },
  { name: "John Doe", email: "john@example.com", password: "password123", role: "user" },
  { name: "Jane Smith", email: "jane@example.com", password: "password123", role: "user" },
  { name: "Bob Wilson", email: "bob@example.com", password: "password123", role: "user" },
  { name: "Alice Johnson", email: "alice@example.com", password: "password123", role: "user" }
];

const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // Clear existing users to avoid duplicates/errors
    await User.deleteMany({});
    
    // Hash passwords before insertion
    const hashedUsers = await Promise.all(testUsers.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      return { ...u, password: hashedPassword };
    }));

    const result = await User.insertMany(hashedUsers);
    console.log(`✅ Successfully added ${result.length} test users to MongoDB Atlas (with hashed passwords)!`);
    console.log('\nAdded users:');
    result.forEach(u => console.log(`  • ${u.name} (${u.email}) - Role: ${u.role}`));
    const totalUsers = await User.countDocuments();
    console.log(`\n👥 Total users now: ${totalUsers}`);
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Connection or Insertion Error:', e.message);
    process.exit(1);
  });
