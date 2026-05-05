const mongoose = require('mongoose');
const Book = require('./models/Book');

mongoose.connect('mongodb://127.0.0.1:27017/elibrary_mobile')
  .then(async () => {
    // Update all book URLs from HTTPS to HTTP
    const result = await Book.updateMany(
      { legacyId: { $gte: 101, $lte: 120 } },
      [
        {
          $set: {
            coverUrl: { $replaceAll: { input: "$coverUrl", find: "https://", replacement: "http://" } }
          }
        }
      ],
      { upsert: false }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} books with HTTP image URLs`);
    
    // Verify the update
    const sample = await Book.findOne({ legacyId: 101 });
    console.log(`\n📸 Sample book (1984) cover URL:\n${sample.coverUrl}\n`);
    
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
