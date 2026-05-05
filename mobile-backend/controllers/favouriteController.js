const Favourite = require('../models/Favourite');
const Book = require('../models/Book');

const addFavourite = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'Book ID is required' });

    const favourite = await Favourite.create({
      user: req.user._id,
      bookId
    });
    res.status(201).json(favourite);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Book is already inside your Favourites collection' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getFavourites = async (req, res) => {
  try {
    const favourites = await Favourite.find({ user: req.user._id }).sort('-createdAt');
    if (favourites.length === 0) return res.json([]);

    const bookIds = favourites.map(f => f.bookId);
    if (bookIds.length > 0) {
       // Search local Mongo instead of exterior MySQL pool!
       const books = await Book.find({ legacyId: { $in: bookIds } });
       
       const combined = favourites.map(fav => {
           let bookDetails = books.find(b => b.legacyId === fav.bookId);
           if (bookDetails) bookDetails = bookDetails.toObject();
           return { ...fav.toObject(), book: bookDetails || null };
       });
       return res.json(combined);
    }
    
    res.json(favourites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeFavourite = async (req, res) => {
  try {
    const { bookId } = req.params;
    await Favourite.findOneAndDelete({ user: req.user._id, bookId });
    res.json({ message: 'Target book effectively removed from favourites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addFavourite, getFavourites, removeFavourite };
