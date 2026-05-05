const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/elibrary";

const userBooks = [
  {
    title: "The great",
    author: "Scot",
    description: "Mysterious",
    category: "Technology",
    isDeleted: false,
    isAvailable: true
  },
  {
    title: "The elephant",
    author: "Scott",
    description: "Mysterious",
    category: "Fiction",
    isDeleted: false,
    isAvailable: true
  },
  {
    title: "The students electric",
    author: "Scott",
    description: "It is a novel",
    category: "Fiction",
    isDeleted: false,
    isAvailable: true
  },
  {
    title: "Black sheep garden",
    author: "Scott",
    description: "Funny",
    category: "History",
    isDeleted: false,
    isAvailable: true
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    description: "An exploration of the origin and evolution of the universe.",
    category: "Science",
    isDeleted: false,
    isAvailable: true
  }
];

async function restoreBooks() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    console.log("Cleaning database... (Removing the 1192 imported books)");
    await Book.deleteMany({});
    
    console.log("Adding your specific books...");
    await Book.insertMany(userBooks);

    console.log("Successfully restored ONLY your specific books.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error restoring books:", error);
    process.exit(1);
  }
}

restoreBooks();
