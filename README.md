

# WhereIsMyLoo

<img width="3160" height="1717" alt="image" src="https://github.com/user-attachments/assets/7b685643-ca63-49b1-a336-393a94522441" />
<img width="3168" height="1721" alt="image" src="https://github.com/user-attachments/assets/e6137d05-dd5d-48f5-b119-9913a40b441b" />
<img width="3159" height="1728" alt="image" src="https://github.com/user-attachments/assets/d5fc8176-f2e3-4cb4-a666-88d886ad8e27" />
<img width="3169" height="1717" alt="image" src="https://github.com/user-attachments/assets/f1bca052-8626-4cc2-83ab-545c3b4e387b" />




<!-- Brief, human-friendly summary of the project -->
Find nearby public restrooms. Node.js + Express + MongoDB backend with EJS views.


#LIVE LINK - https://whereismyloo.onrender.com/
---

## Table of Contents
<!-- Helps quick navigation for longer READMEs -->
- Features
- Tech Stack
- Prerequisites
- Setup
- Environment Variables
- Running the App
- Project Structure
- API and Routes
- Data Model (Example)
- Views and EJS Notes
- Method-Override Usage
- Scripts
- Troubleshooting
- License

---

## Features
<!-- List core capabilities. Adjust as your app grows. -->
- RESTful CRUD for toilets
- MongoDB via Mongoose
- EJS templating
- method-override for PUT/DELETE via HTML forms
- dotenv-based configuration
- location access

---

## Tech Stack
<!-- Name the primary tools to set expectations for contributors -->
- Node.js, Express
- MongoDB, Mongoose
- EJS templating
- dotenv, method-override

---

## Prerequisites
<!-- Required software before installing -->
- Node.js 18+ and npm
- MongoDB (local or Atlas)

---

## Setup
<!-- Steps to get a local dev environment -->
1) Install dependencies

```
npm instll
```

2) Configure env 🔐
- Create a .env file in the project root.
- Add connection string and app settings.

Example:
```
MONGO_URI=mongodb://127.0.0.1:27017/where-is-my-loo
PORT=3000
NODE_ENV=development
```

3) Run the app 🚀
- Development (auto-reload):
```
npm run dev
```
- Production:
```
npm start
```
- Open http://localhost:3000

---

Environment Variables 🔧
- MONGO_URI: MongoDB connection string.
- PORT: HTTP port (default 3000).
- NODE_ENV: development | production.

---

Project Structure 🧱
- src/
    - app.js
    - routes/
        - toilets.js
        - index.js
    - models/
        - Toilet.js
    - controllers/
        - toilets.js
    - views/
        - layouts/
        - partials/
        - toilets/
            - index.ejs
            - new.ejs
            - show.ejs
            - edit.ejs
    - middleware/
    - public/
        - css/
        - js/
- .env
- package.json
- README.md

---

Routes and API 🔗
- GET /toilets ➜ list
- GET /toilets/new ➜ form
- POST /toilets ➜ create
- GET /toilets/:id ➜ details
- GET /toilets/:id/edit ➜ edit form
- PUT /toilets/:id ➜ update
- DELETE /toilets/:id ➜ remove



---

Data Model (example) 🧬
- name: string
- description: string
- location: GeoJSON Point { coordinates: [lng, lat] }
- accessible: boolean
- rating: number (1–5)
- hours: string

Mongoose sketch:
```
new Schema({
    name: { type: String, required: true },
    description: String,
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    accessible: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    hours: String
});
```

---

EJS Views 🎨
- Use a base layout for header/footer/flash.
- Share partials for nav and forms.
- Keep forms minimal and server-validate input.

---

Method-Override 🛠️
Server:
```
app.use(methodOverride('_method'));
```
Form example:
```
<form action="/toilets/<%= toilet._id %>?_method=PUT" method="POST">
    <!-- fields -->
    <button type="submit">Save</button>
</form>
```

---

Scripts 📜
- start: node ./src/app.js
- dev: nodemon ./src/app.js
- lint: eslint .
- format: prettier --write .

Add to package.json:
```
{
    "scripts": {
        "start": "node ./src/app.js",
        "dev": "nodemon ./src/app.js",
        "lint": "eslint .",
        "format": "prettier --write ."
    }
}
```

---

Troubleshooting 🧯
- Mongo not running: start MongoDB locally or update MONGO_URI.
- Cannot connect to Atlas: whitelist IP and verify credentials.
- EADDRINUSE: change PORT or stop the existing process.
- Views not found: check view engine setup and paths.

---

License 📄
- Choose and include a license (e.g., MIT) in LICENSE file.
