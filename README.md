## Backend-First Project Roadmap

- [ ] **Phase 1: Define the Core API Features**
  - Write down what resources your backend will manage (e.g., Users, Posts, Items).
  - List the main actions (e.g., "Create an account", "Log in", "Save an item", "Get a list of items").

- [ ] **Phase 2: Design the Database Schema & Relations**
  - Draw or map out your database tables/collections.
  - Define the fields for each table (e.g., User: id, email, password_hash).
  - Establish relationships (e.g., One User has many Items).

- [ ] **Phase 3: Route Architecture (API Contract)**
  - Map out your API endpoints, HTTP methods, and expected JSON data.
  - *Example:* `POST /api/auth/register` (To create a user)
  - *Example:* `GET /api/items` (To fetch data)

- [ ] **Phase 4: Pick the Tech Stack**
  - Choose a runtime/language (e.g., Node.js, Python, Go).
  - Choose a framework (e.g., Express, Fastify, FastAPI).
  - Choose a database (e.g., PostgreSQL, MongoDB) and an ORM/ODM (like Prisma or Mongoose).

- [ ] **Phase 5: Coding Milestones (Backend)**
  - Milestone 1: Set up the server and create a simple "Health Check" endpoint (`GET /`).
  - Milestone 2: Connect the database and successfully run a database migration or connection script.
  - Milestone 3: Build and test the POST endpoints using Postman/Bruno to insert data.
  - Milestone 4: Build and test GET endpoints to retrieve that data.

- [ ] **Phase 6: The Fullstack Transition (Future)**
  - Build the frontend UI.
  - Use `fetch` or `axios` to connect your UI components to the API endpoints built in Phase 5.
