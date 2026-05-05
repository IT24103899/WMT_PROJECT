const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config(); // Automatically locates .env in active execution directory

const Book = require('../models/Book');

const migrate = async () => {
  let sqlPool;
  try {
    console.log('--- Starting Database Migration ---');

    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB Core.');

    // 2. Connect MySQL
    sqlPool = mysql.createPool({
      uri: process.env.MYSQL_URI,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('[OK] Established secure tunnel to MySQL.');

    // 3. Fetch Data dynamically natively
    const [rows] = await sqlPool.query('SELECT * FROM books');
    console.log(`[INFO] Located ${rows.length} records inside MySQL database.`);

    // 4. Migrate Logic Loop
    let inserted = 0;
    for (const row of rows) {
      // Prevents migrating duplicates by scanning legacyId logic
      const exists = await Book.findOne({ legacyId: row.id });
      if (!exists) {
        await Book.create({
          legacyId: row.id,
          title: row.title,
          author: row.author,
          description: row.description,
          content: row.content, // Maps longtext objects natively
          totalPages: row.total_pages,
          coverUrl: row.cover_url,
          pdfUrl: row.pdf_url,
          isbn: row.isbn,
          publicationYear: row.publication_year,
          category: row.category,
          isDeleted: row.is_deleted === 1,
          isAvailable: row.is_available === 1
        });
        inserted++;
      }
    }
    
    console.log(`\n--- [SUCCESS] Migration Complete! ---`);
    console.log(`Pushed ${inserted} new books directly into MongoDB Collection 'books'.`);
  } catch (error) {
    console.error('[ERROR] Fatal failure during transmission:', error);
  } finally {
    // Safely unbind all database pools so terminal closes gracefully
    if (sqlPool) await sqlPool.end();
    await mongoose.connection.close();
    process.exit();
  }
};

migrate();
