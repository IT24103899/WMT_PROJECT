# 📚 eLibrary Mobile App

A full-stack mobile reading platform built with **React Native (Expo)** and **Node.js / Express**, enabling users to discover books, manage personalised reading lists, track progress, and receive AI-powered recommendations.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Component: Favourites & Personal Bookshelf](#component-favourites--personal-bookshelf)
  - [Features](#features)
  - [Database Models](#database-models)
  - [API Endpoints](#api-endpoints)
  - [Frontend Screen](#frontend-screen)
  - [API Service Layer](#api-service-layer)
- [Other Components](#other-components)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## Project Overview

eLibrary is a cross-platform mobile application that allows readers to:

- Browse and search a curated book catalogue
- Manage a **personal bookshelf** with reading lists (Reading Now, Favourites, Wishlist)
- **Favourite** individual books for quick access
- Track reading history and progress
- Leave and read book reviews and ratings
- Receive AI-powered book recommendations
- Use QR code scanning for quick book lookup
- Admin dashboard for managing users and content

---

## Tech Stack

### Frontend (`mobile-app/`)
| Technology | Purpose |
|---|---|
| React Native 0.83 | Cross-platform mobile UI |
| Expo SDK 55 | Build tooling, camera, fonts, linear gradient |
| React Navigation 7 | Stack and bottom-tab navigation |
| Axios | HTTP client with JWT interceptor |
| AsyncStorage | Local token persistence |
| Expo Linear Gradient | Gradient UI elements |
| Ionicons | Icon library |

### Backend (`mobile-backend/`)
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Primary database (NoSQL) |
| JSON Web Tokens (JWT) | Auth / route protection |
| bcryptjs | Password hashing |
| Multer | File / image upload handling |
| dotenv | Environment variable management |

---

## Project Structure

```
wmt_mobile_app/
├── mobile-app/                  # React Native frontend
│   ├── App.js                   # Root navigation setup
│   ├── src/
│   │   ├── screens/
│   │   │   ├── bookshelf/
│   │   │   │   └── BookshelfScreen.js   ← Bookshelf & Favourites UI
│   │   │   ├── books/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── search/
│   │   │   ├── activity/
│   │   │   ├── feedback/
│   │   │   ├── admin/
│   │   │   ├── reader/
│   │   │   ├── qr/
│   │   │   └── user/
│   │   ├── services/
│   │   │   └── api.js           # Centralised Axios API service
│   │   ├── context/
│   │   │   └── ThemeContext.js  # Dark/light mode provider
│   │   └── config/
│   │       └── api.js           # Base URL configuration
│
└── mobile-backend/              # Express + MongoDB backend
    ├── server.js                # App entry point & route mounting
    ├── models/
    │   ├── Bookshelf.js         ← Bookshelf schema
    │   ├── Favourite.js         ← Favourite schema
    │   ├── Book.js
    │   └── User.js
    ├── controllers/
    │   ├── bookshelfController.js  ← Bookshelf logic
    │   └── favouriteController.js  ← Favourites logic
    ├── routes/
    │   ├── bookshelfRoutes.js   ← /api/bookshelf
    │   └── favouriteRoutes.js   ← /api/favourites
    ├── middleware/
    │   └── authMiddleware.js    # JWT protect middleware
    └── config/
        └── db.js                # MongoDB connection
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)
- Expo Go app on your phone (for testing)

### Backend Setup

```bash
cd mobile-backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables)), then:

```bash
npm run dev
```

The server starts on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd mobile-app
npm install
expo start
```

Scan the QR code with **Expo Go** on your device, or press `a` for Android emulator / `i` for iOS simulator.

---

## Component: Favourites & Personal Bookshelf

> **Owner:** [Your Name]  
> **Branch:** `feature/bookshelf-favourites`

This component gives every user a **personal library** — a named reading list system (shelves) plus a dedicated Favourites collection. It is one of the core user-facing features of the app.

---

### Features

| Feature | Description |
|---|---|
| 📖 Reading Now shelf | Track books currently being read |
| ❤️ Favourites shelf | Save all-time favourite books |
| ⭐ Wishlist shelf | Queue books to read in the future |
| ➕ Add to shelf | Add a book to any shelf from the Book Detail screen |
| 🗑️ Remove from shelf | Remove a book from a shelf entirely |
| 🔄 Move between shelves | Reassign a book to a different shelf |
| 📊 Reading status | Tag a book as `want-to-read`, `currently-reading`, or `completed` |
| 🔃 Pull to refresh | Real-time data sync via pull-down gesture |
| 🌗 Dark / Light mode | Fully themed via `ThemeContext` |
| 🔗 Sync | Adding to Favourites shelf automatically syncs to the standalone Favourites collection |

---

### Database Models

#### `Bookshelf` model — `models/Bookshelf.js`

Stores every book a user has added to any named shelf.

```js
{
  user:     ObjectId  // ref: 'User'       (required)
  bookId:   ObjectId  // ref: 'Book'       (required)
  listType: String    // 'reading' | 'favourites' | 'wishlist' | custom
  status:   String    // 'want-to-read' | 'currently-reading' | 'completed'
  createdAt, updatedAt  // auto timestamps
}
```

> Unique compound index on `{ user, bookId, listType }` — prevents duplicate entries per shelf.

---

#### `Favourite` model — `models/Favourite.js`

A dedicated, lightweight collection for quickly querying a user's favourite books.

```js
{
  user:     ObjectId  // ref: 'User'  (required)
  bookId:   Mixed     // supports both ObjectId and legacy numeric IDs
  legacyId: Number    // optional legacy system compatibility
  createdAt, updatedAt  // auto timestamps
}
```

> Unique compound index on `{ user, bookId }` — a user cannot favourite the same book twice.

---

### API Endpoints

All routes require a **Bearer JWT token** in the `Authorization` header.

#### Bookshelf — `/api/bookshelf`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bookshelf` | Get full bookshelf grouped by shelf (`reading`, `favourites`, `wishlist`) |
| `POST` | `/api/bookshelf` | Add a book to a shelf — body: `{ bookId, listType }` |
| `DELETE` | `/api/bookshelf/:bookId` | Remove a book from all shelves |
| `PUT` | `/api/bookshelf/:bookId` | Update reading status — body: `{ status }` |
| `PUT` | `/api/bookshelf/:bookId/move` | Move to a different shelf — body: `{ targetList }` |
| `POST` | `/api/bookshelf/lists` | Create a named shelf |
| `DELETE` | `/api/bookshelf/lists/:listId` | Delete an entire shelf and all its entries |
| `DELETE` | `/api/bookshelf/lists/:listType/clear` | Clear all books from a shelf |

**Example response — `GET /api/bookshelf`:**
```json
{
  "reading": [
    {
      "_id": "...",
      "bookId": { "title": "Dune", "author": "Frank Herbert", "coverUrl": "..." },
      "status": "currently-reading"
    }
  ],
  "favourites": [ "..." ],
  "wishlist": [ "..." ]
}
```

---

#### Favourites — `/api/favourites`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/favourites` | Get all favourited books with full book details |
| `POST` | `/api/favourites` | Add a book to favourites — body: `{ bookId }` |
| `DELETE` | `/api/favourites/:bookId` | Remove a book from favourites |

**Example response — `GET /api/favourites`:**
```json
[
  {
    "_id": "...",
    "user": "userId",
    "bookId": 42,
    "book": {
      "title": "The Hobbit",
      "author": "J.R.R. Tolkien",
      "coverUrl": "https://..."
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Frontend Screen

**File:** `mobile-app/src/screens/bookshelf/BookshelfScreen.js`

The screen is a single-page tabbed UI with three shelf tabs.

#### Key UI behaviours

- **Gradient header** — colour changes dynamically based on the active shelf tab
- **Floating shelf tabs** — pill-shaped tabs that overlap the header using negative margin-top
- **Book cards** — displays cover image, title, author, and a colour-coded status badge
- **Empty state** — shows a friendly message and a "Find Great Books" CTA that navigates to the Books tab
- **Pull-to-refresh** — triggers a fresh API call
- **Tap to navigate** — pressing a card navigates to `BookDetail` with the book's data pre-loaded

#### Shelf configuration

```js
const SHELVES = [
  { id: 'reading',    label: 'Reading Now', color: '#12c2e9', icon: 'book'  },
  { id: 'favourites', label: 'Favourites',  color: '#f64f59', icon: 'heart' },
  { id: 'wishlist',   label: 'Wishlist',    color: '#c471ed', icon: 'star'  },
];
```

---

### API Service Layer

**File:** `mobile-app/src/services/api.js`

All API calls go through a centralised Axios instance that automatically attaches the user's JWT token on every request via a request interceptor.

#### Bookshelf service functions

```js
getBookshelf()                          // GET    /bookshelf
addToBookshelf(bookId, listType)        // POST   /bookshelf
removeFromBookshelf(bookId)             // DELETE /bookshelf/:bookId
updateBookshelfStatus(bookId, status)   // PUT    /bookshelf/:bookId
moveBookshelfItem(bookId, targetList)   // PUT    /bookshelf/:bookId/move
createBookshelfList(name)               // POST   /bookshelf/lists
deleteBookshelfList(listId)             // DELETE /bookshelf/lists/:listId
clearBookshelfList(listType)            // DELETE /bookshelf/lists/:listType/clear
```

#### Favourites service functions

```js
getFavourites()           // GET    /favourites
addFavourite(bookId)      // POST   /favourites
removeFavourite(bookId)   // DELETE /favourites/:bookId
```

---

## Other Components

| Component | Description | Owner |
|---|---|---|
| Auth | Registration, login, profile management | - |
| Books | Book catalogue, detail view, book upload | - |
| Search | Full-text search with history | - |
| Reviews & Ratings | Star ratings and written reviews | - |
| Reading Activity | Progress tracking, reading stats | - |
| QR Scanner | Scan QR codes to look up books | - |
| Admin | User management, dashboard stats | - |

---

## Environment Variables

Create a `.env` file inside `mobile-backend/`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/elibrary
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

> ⚠️ Never commit `.env` to version control. It is already listed in `.gitignore`.

---

## Contributing

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-component-name
   ```
2. Make your changes and commit with clear messages.
3. Push your branch and open a Pull Request for review.

---

*Built as part of the WMT Mobile App group project.*
