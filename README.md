# Library Catalog Service

A MongoDB-backed library catalog API that exposes CRUD endpoints for books and genres, plus query-based filtering, search, and pagination. The seed script creates four genres and sixteen sample books.

## Requirements

- Node.js 18 or newer
- A MongoDB instance (local MongoDB or MongoDB Atlas)

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`, set `MONGODB_URI` to your MongoDB connection string, and replace `AUTH_TOKEN_SECRET` with a long random secret.
3. Run `npm run seed` to populate sample catalog data.
4. Start the API with `npm start`.

The seed creates one librarian account: `librarian@library.local` with password `LibraryDemo123!`. These are test credentials; set `LIBRARIAN_EMAIL` and `LIBRARIAN_PASSWORD` before seeding a non-demo environment. Public registration creates patron accounts only.

## Authentication and Authorization

- `POST /api/auth/register` — create a patron account with `username`, `email`, and `password` (minimum 8 characters).
- `POST /api/auth/login` — verify credentials and set the signed-in session cookie.
- `POST /api/auth/logout` — clear the session cookie from the client.
- `GET /api/users/profile` — return the authenticated caller's own profile.
- `POST /books`, `PUT /books/:id`, and `DELETE /books/:id` — require a librarian session.

Passwords are hashed with bcrypt before they are stored. Send JSON credentials to register or log in, then allow the client to retain and send cookies for subsequent requests.

## Token Storage

The API stores its JWT in an `authToken` cookie marked `HttpOnly`, `SameSite=Strict`, and `Secure` in production. The browser sends the cookie with matching requests, but client-side JavaScript cannot read its value. This reduces the chance that a cross-site scripting (XSS) bug can steal a bearer token, unlike a token saved in `localStorage`; it does not prevent XSS from making requests as the signed-in user while the page is compromised. `SameSite=Strict` provides a baseline defense against cross-site request forgery (CSRF), but applications that need cross-site embedding or broader cookie use should add explicit CSRF protection and origin checks. Cookies also require clients to preserve/send credentials, which is less convenient for command-line clients than an `Authorization` header. Tokens expire after one hour. Logout clears the cookie on the client; there is no server-side token blocklist, so a copied token remains valid until it expires.

## API Endpoints

### Genres

- `GET /genres` — list all genres
- `GET /genres/:id` — get a single genre by ID
- `POST /genres` — create a genre (201)
- `PUT /genres/:id` — update a genre (200)
- `DELETE /genres/:id` — delete a genre (200; returns 400 if books still reference it)

### Books

- `GET /books` — list books with optional filters and pagination
- `GET /books/:id` — get a single book by ID
- `POST /books` — create a book (201; librarian session required)
- `PUT /books/:id` — update a book (200; librarian session required)
- `DELETE /books/:id` — delete a book (200; librarian session required)

## Book Query Parameters

`GET /books` supports these query parameters:

- `genre=<genreId>` — only return books in that genre
- `search=<text>` — case-insensitive match against `title` or `author`
- `page=<n>` — page number (defaults to `1`)
- `limit=<n>` — number of results per page (defaults to `10`)

These options can be combined in one request, for example:

- `GET /books?genre=64dbd5d4d5d7a1b2a3c4d5e6&search=dune&page=2&limit=5`

The response includes both the array of matching books and pagination metadata:

```json
{
  "data": [
    { "_id": "...", "title": "Dune" }
  ],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 18,
    "totalPages": 4
  }
}
```

## Validation Behavior

All create and update endpoints validate the request body and return HTTP 400 with a clear, field-specific error when input is invalid.

Examples include:

- missing required fields
- wrong or empty string values
- non-integer totals or negative counts
- `availableCopies > totalCopies`
- invalid or nonexistent `genre` IDs

The API does not expose raw Mongoose validation or cast errors to the client.

## Genre Deletion Policy

Deleting a genre is blocked if any books still reference it. This avoids orphaned book records and keeps referential integrity intact. The API returns a 400 error with a message explaining that the genre is still in use.

## Schema Design

`Book` stores information that describes one catalog title, while `Genre` is a separate collection because many books can share a genre. The genre is referenced by MongoDB ObjectId instead of copying the genre name into every book. That keeps the label and slug consistent when they change, at the cost of an additional lookup when displaying a book with its genre.

| Book field | Storage choice | Reasoning and trade-off |
| --- | --- | --- |
| `title` | Embedded string | A title belongs to one catalog record and is read with the book. A separate title collection would add joins without useful reuse. |
| `author` | Embedded string | The assignment needs a display name, not a separately managed author profile. Keeping it on the book makes catalog reads simple; a future author collection would be appropriate if the service needs shared biographies or author-specific pages. |
| `isbn` | Embedded unique string | The ISBN identifies this edition and belongs directly to its book record. A unique index prevents duplicate catalog entries for the same ISBN. |
| `description` | Embedded string | Descriptive text is specific to this catalog record and is usually requested with the title, so embedding avoids another query. |
| `coverImage` | Embedded URL string | The cover URL is a single value displayed with the book. Storing the URL avoids a separate media document; richer image metadata or multiple editions could justify a separate collection later. |
| `totalCopies` | Embedded number | This is the library's local inventory count for this catalog title, so keeping it with the book makes the common availability view direct. It must be a nonnegative integer. |
| `availableCopies` | Embedded number | The on-shelf count changes with checkouts and returns and is read alongside total stock. Keeping both counts together avoids an aggregation on every catalog read; updates should change the counts atomically so they stay consistent. It must be a nonnegative integer no greater than `totalCopies`. |
| `genre` | Referenced ObjectId (`ref: 'Genre'`) | Many books share the same genre and its display name/slug should have one source of truth. The reference avoids duplicated labels and supports updates, at the cost of populating or separately fetching the genre for display. |

`Genre.name` and `Genre.slug` are required and unique. The slug is stored in lowercase so it can be used consistently in URLs. Book ISBNs are required and unique; all book fields are required, and the genre reference must point to a `Genre` document created by the seed script.

## Postman Collection

The exported collection is stored at `postman/library-catalog.postman_collection.json` and contains requests for every endpoint in the service, including a saved 400 validation example.

## Running the API

```bash
npm run seed
npm start
```

The server listens on `http://localhost:3000` by default. The `PORT` environment variable can be set to override the port.
