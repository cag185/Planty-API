# Planty API

The backend REST API for the **Planty** application — a plant tracking app that allows users to manage their personal plant collections. This API is built with Node.js and Express, backed by a MySQL database, and is deployed to [Railway](https://railway.app).

---

## Tech Stack

| Package                                                      | Purpose                                              |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| [Express](https://expressjs.com/)                            | Web framework and routing                            |
| [mysql2](https://www.npmjs.com/package/mysql2)               | MySQL database driver                                |
| [bcrypt](https://www.npmjs.com/package/bcrypt)               | Password hashing and salting                         |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)   | JWT-based authentication                             |
| [dotenv](https://www.npmjs.com/package/dotenv)               | Environment variable management                      |
| [cors](https://www.npmjs.com/package/cors)                   | Cross-origin resource sharing (for Netlify frontend) |
| [morgan](https://www.npmjs.com/package/morgan)               | HTTP request logging                                 |
| [cookie-parser](https://www.npmjs.com/package/cookie-parser) | Cookie parsing middleware                            |

---

## Project Structure

```
planty-api/
├── app.js              # Express app setup, middleware, and route registration
├── db.js               # Shared MySQL connection with auto-reconnect logic
├── bin/
│   └── www             # Server entry point, reads PORT from environment
├── routes/
│   ├── users.js        # User authentication and CRUD endpoints
│   ├── plants.js       # Plant CRUD endpoints and user-plant associations
│   ├── health.js       # Health check endpoint
│   └── index.js        # Root route
└── .env                # Local environment variables (not committed to git)
```

---

## Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=planty
DB_PORT=3306
JWT_SECRET=your_jwt_secret
PORT=8080
```

In production (Railway), these variables are set directly in the Railway dashboard. `PORT` is automatically provided by Railway at runtime.

---

## Running Locally

```bash
# Install dependencies
yarn install

# Start the server
yarn start
```

The server will run on `http://localhost:8080` by default.

---

## API Endpoints

### Health

| Method | Endpoint  | Description                                         |
| ------ | --------- | --------------------------------------------------- |
| GET    | `/health` | Returns `{ status: "ok" }` if the server is running |

---

### Users — `/users`

| Method | Endpoint       | Description                    |
| ------ | -------------- | ------------------------------ |
| GET    | `/users/`      | Get all users                  |
| GET    | `/users/:id`   | Get a specific user by ID      |
| POST   | `/users/`      | Create (sign up) a new user    |
| POST   | `/users/login` | Log in and receive a JWT token |
| PUT    | `/users/:id`   | Update a user's details        |
| DELETE | `/users/:id`   | Delete a user by ID            |

#### Sign Up — `POST /users/`

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "plaintext_password"
}
```

Passwords are salted and hashed with bcrypt before being stored. Plain text passwords are never saved.

#### Login — `POST /users/login`

```json
{
  "email": "user@example.com",
  "password": "plaintext_password"
}
```

Returns a JWT token (expires in 7 days) and the user's info (password excluded):

```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "John Doe", "email": "user@example.com", ... }
}
```

---

### Plants — `/plants`

| Method | Endpoint                   | Description                                 |
| ------ | -------------------------- | ------------------------------------------- |
| GET    | `/plants/`                 | Get all plants                              |
| GET    | `/plants/user?user_id=:id` | Get all plants belonging to a specific user |
| GET    | `/plants/:id`              | Get a specific plant by ID                  |
| POST   | `/plants/`                 | Create a new plant and link it to a user    |
| PUT    | `/plants/:id`              | Update a plant's details                    |
| DELETE | `/plants/:id`              | Delete a plant by ID                        |

#### Create a Plant — `POST /plants/`

```json
{
  "name": "Monstera",
  "species": "Monstera deliciosa",
  "watering_frequency_days": 7,
  "user_id": 1
}
```

Creating a plant also creates a record in `users_to_plants`, automatically linking the plant to the provided user.

---

## Authentication

Login returns a JWT token. The frontend (Planty on Netlify) should store this token and pass it as a Bearer token in the `Authorization` header for protected requests:

```
Authorization: Bearer <token>
```

---

## Deployment

- **API**: Deployed to [Railway](https://railway.app) at `https://planty-api-production.up.railway.app`
- **Database**: MySQL instance also hosted on Railway
- **Frontend**: Deployed to [Netlify](https://netlify.com) at `https://plantyv1.netlify.app`

CORS is configured to allow requests from the Netlify frontend and `localhost:3000` for local development.
