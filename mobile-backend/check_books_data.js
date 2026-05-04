const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Book = require('./models/Book');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const books = await Book.find({}).limit(10).lean();
    console.log('--- Books in Database ---');
    books.forEach(b => {
      console.log(`Title: ${b.title}`);
      console.log(`ID: ${b._id}`);
      console.log(`LegacyID: ${b.legacyId}`);
      console.log(`PDF URL: ${b.pdfUrl || 'MISSING'}`);
      console.log('------------------------');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkBooks();
