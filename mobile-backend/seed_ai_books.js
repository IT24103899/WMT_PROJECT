const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/elibrary";
const CSV_FILE = path.join(__dirname, '..', 'Python-ranker', 'book.csv');

async function seedBooks() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // Check if CSV exists
    if (!fs.existsSync(CSV_FILE)) {
      console.error(`Error: CSV file not found at ${CSV_FILE}`);
      process.exit(1);
    }

    const books = [];
    console.log("Reading CSV and preparing data...");

    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to MongoDB Schema
        // Unnamed: 0,book_id,authors,original_publication_year,title,language_code,average_rating,image_url,description
        books.push({
          legacyId: parseInt(row.book_id) || 0,
          title: row.title || 'Untitled',
          author: row.authors || 'Unknown Author',
          description: row.description || '',
          publicationYear: parseInt(row.original_publication_year) || 2024,
          coverUrl: row.image_url || '',
          rating: parseFloat(row.average_rating) || 0,
          // Default values for missing fields
          content: "Enjoy this premium title from our AI-curated collection.",
          totalPages: 100,
          pdfUrl: "https://www.planetebook.com/free-ebooks/the-great-gatsby.pdf", // Default demo PDF
          category: row.language_code === 'en' ? 'English Literature' : 'World Classics',
          isDeleted: false,
          isAvailable: true
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${books.length} books. Starting import...`);
        
        // Optional: Clear existing books if requested by context "those are want to apper"
        // await Book.deleteMany({}); 
        
        let count = 0;
        for (const book of books) {
          try {
            // Use upsert to avoid duplicates by legacyId
            await Book.findOneAndUpdate(
              { legacyId: book.legacyId },
              book,
              { upsert: true, new: true }
            );
            count++;
            if (count % 100 === 0) console.log(`Imported ${count} books...`);
          } catch (e) {
            console.error(`Failed to import book ${book.title}:`, e.message);
          }
        }

        console.log(`Successfully synced ${count} books from AI CSV to MongoDB.`);
        mongoose.connection.close();
        console.log("Database connection closed.");
      });

  } catch (error) {
    console.error("Critical seeding error:", error);
    process.exit(1);
  }
}

seedBooks();
