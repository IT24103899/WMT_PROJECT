const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config(); 

const User = require('../models/User');
const Favourite = require('../models/Favourite');
const Activity = require('../models/Activity');
const SearchHistory = require('../models/SearchHistory');
const Feedback = require('../models/Feedback');
const Book = require('../models/Book');

const migrate = async () => {
  let sqlPool;
  try {
    console.log('--- Starting Advanced Database Relational Migration ---');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB Core.');

    sqlPool = mysql.createPool({
      uri: process.env.MYSQL_URI,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('[OK] Established secure tunnel to MySQL.');

    // 1. Migrate Users
    const [users] = await sqlPool.query('SELECT * FROM users');
    console.log(`[INFO] Found ${users.length} Users in MySQL.`);
    let userMap = {}; // Maps MySQL ID -> MongoDB _id
    let usersInserted = 0;

    for (const row of users) {
      let mongoUser = await User.findOne({ legacyId: row.id });
      if (!mongoUser) {
        // Also check if email exists to avoid conflicts from earlier manual tests
        mongoUser = await User.findOne({ email: row.email });
        if (!mongoUser) {
          mongoUser = await User.create({
            legacyId: row.id,
            name: row.fullName || row.full_name,
            email: row.email,
            password: row.password, 
            role: (row.role || 'user').toLowerCase(),
            bio: row.bio,
            profilePictureUrl: row.profile_picture_url,
            readingPreference: row.reading_preference,
            isPremium: row.is_premium === 1 || row.is_premium === true,
            createdAt: row.created_at
          });
          usersInserted++;
        } else {
          // If User exists but missing legacyId, patch it dynamically
          mongoUser.legacyId = row.id;
          await mongoUser.save();
        }
      }
      userMap[row.id] = mongoUser._id;
    }
    console.log(`[SUCCESS] Migrated ${usersInserted} users. Memory mapping complete.`);

    // 2. Migrate Bookshelf (Favourites)
    let bookshelfInserted = 0;
    try {
      const [bookshelves] = await sqlPool.query('SELECT * FROM bookshelf_items');
      console.log(`[INFO] Found ${bookshelves.length} Bookshelf Items.`);
      
      for (const row of bookshelves) {
        const mongoUserId = userMap[row.user_id];
        if (!mongoUserId) continue; // Orphan data protection
        
        const exists = await Favourite.findOne({ legacyId: row.id });
        if (!exists) {
          await Favourite.create({
            legacyId: row.id,
            user: mongoUserId,
            // Our Node schema expects the MySQL Book ID directly into `bookId: Number`
            bookId: row.id || row.book_id || 1, 
            title: row.title,
            author: row.author,
            progress: row.progress,
            rating: row.rating,
            listName: row.list_name,
            status: row.status,
            coverImage: row.cover_image,
            createdAt: row.borrowed_at || new Date()
          });
          bookshelfInserted++;
        }
      }
      console.log(`[SUCCESS] Migrated ${bookshelfInserted} BookShelf records.`);
    } catch (e) {
      console.log('[WARN] Optional table bookshelf_items skipped or error:', e.message);
    }

    // 3. Migrate Activity Logs
    let activityInserted = 0;
    try {
      const [activities] = await sqlPool.query('SELECT * FROM activity_logs');
      console.log(`[INFO] Found ${activities.length} Activity Logs.`);
      
      for (const row of activities) {
        const mongoUserId = userMap[row.user_id];
        if (!mongoUserId) continue; 
        
        const exists = await Activity.findOne({ legacyId: row.id });
        if (!exists) {
          await Activity.create({
            legacyId: row.id,
            user: mongoUserId,
            bookId: row.book_id || 1, // Fallback
            action: row.action || 'view',
            details: row.details,
            lastReadAt: row.created_at || new Date()
          });
          activityInserted++;
        }
      }
      console.log(`[SUCCESS] Migrated ${activityInserted} Activity Log records.`);
    } catch (e) {
      console.log('[WARN] Optional table activity_logs skipped or error:', e.message);
    }

    // 4. Migrate Feedback
    let feedbackInserted = 0;
    try {
      const [feedbacks] = await sqlPool.query('SELECT * FROM feedback');
      console.log(`[INFO] Found ${feedbacks.length} Feedback records.`);
      
      for (const row of feedbacks) {
        let mongoUserId = row.user_id ? userMap[row.user_id] : null;

        const exists = await Feedback.findOne({ legacyId: row.id });
        if (!exists && mongoUserId) {
          await Feedback.create({
            legacyId: row.id,
            userId: mongoUserId,
            message: row.message || row.content,
            rating: row.rating,
            status: row.status,
            createdAt: row.created_at || new Date()
          });
          feedbackInserted++;
        }
      }
      console.log(`[SUCCESS] Migrated ${feedbackInserted} Feedback records.`);
    } catch (e) {
      console.log('[WARN] Optional table feedback skipped or error:', e.message);
    }

    // 5. Migrate Search History
    let searchInserted = 0;
    try {
      const [searches] = await sqlPool.query('SELECT * FROM search_history');
      console.log(`[INFO] Found ${searches.length} Search History records.`);
      
      for (const row of searches) {
        const mongoUserId = userMap[row.user_id];
        if (!mongoUserId) continue; 
        
        const exists = await SearchHistory.findOne({ legacyId: row.id });
        if (!exists) {
          await SearchHistory.create({
            legacyId: row.id,
            userId: mongoUserId,
            term: row.term || row.search_query,
            resultsCount: row.results_count,
            createdAt: row.created_at || new Date()
          });
          searchInserted++;
        }
      }
      console.log(`[SUCCESS] Migrated ${searchInserted} Search History records.`);
    } catch (e) {
      console.log('[WARN] Optional table search_history skipped or error:', e.message);
    }

    console.log(`\n--- [SUCCESS] Full Relational Migration Cycle Complete! ---`);

  } catch (error) {
    console.error('[ERROR] Fatal failure during transmission:', error);
  } finally {
    if (sqlPool) await sqlPool.end();
    await mongoose.connection.close();
    process.exit();
  }
};

migrate();
