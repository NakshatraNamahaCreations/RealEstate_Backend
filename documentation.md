# RealEstate Backend — Project Documentation

## Overview
A Node.js / Express REST API backend for a real-estate platform (project "30Forty"). It manages property listings (for sale), user and admin accounts, property enquiries, and customer favorites. Data is stored in MongoDB via Mongoose. Property images are uploaded to local disk and served statically.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express `^5.1.0`
- **Database:** MongoDB via Mongoose `^8.16.0`
- **Auth/Hashing:** bcrypt `^6.0.0` (password hashing only — no JWT/sessions)
- **File uploads:** multer `^2.0.1` (disk storage)
- **Dates:** moment `^2.30.1`
- **CORS:** cors `^2.8.5` (open to all origins)
- **Config:** dotenv `^16.5.0`
- **Dev:** nodemon (`npm start` runs `nodemon index.js`)

## Entry Point (`index.js`)
- Loads env via dotenv, configures `express.json()`, `urlencoded`, and permissive CORS (`origin: "*"`).
- Serves uploaded images statically at `/sellproperty` from `Public/sellproperty`.
- Connects to MongoDB using `process.env.CONTENT_MONGO_URI`; server only starts (`PORT` or `8001`) after a successful DB connection, otherwise the process exits.
- Health check at `GET /healthz` returning `{ ok, state }` based on mongoose connection state.

## Project Structure
```
index.js                      # App bootstrap, middleware, DB connect, route mounting
package.json
Controller/                   # Request handlers (business logic)
  Auth/Admin.js               # Admin signup/signin/list
  Auth/User.js                # User signup/signin/list/update
  Enquiry/Enquiry.js          # Enquiry CRUD + accept/reject
  Sellproperty/Sellproperty.js# Property CRUD, search, favorites-on-property
  Sellproperty/Favorite.js    # Separate Favorite collection toggle/list
Model/                        # Mongoose schemas
  Auth/Admin.js, Auth/User.js
  Enquiry/Enquiry.js
  Sellproperty/Sellproperty.js
  Sellproperty/Favorite.js.js # (note double ".js.js" filename)
Routes/                       # Express routers per feature
Public/sellproperty/          # Uploaded property images (served statically)
```

## Route Mounting (base paths)
| Mount | Router |
|-------|--------|
| `/api/sell` | Sellproperty |
| `/api/favorites` | Favorite |
| `/api/admin` | Admin auth |
| `/api/enquiry` | Enquiry |
| `/api` | User auth |

## Data Models

### Property (`Model/Sellproperty/Sellproperty.js`) — collection `properties`
Large, flexible listing schema (mostly `String` typed) covering residential, commercial, PG, rental, and land use cases:
- Classification: `propertytype` (required), `type`, `residentialtype`, `commercialtype`, `saletype`, `sellertype`.
- Physical: `Facing`, `Dimensions`, `totalarea`, `bedrooms`, `bathrooms`, `furnishing`, `floor_no`, `office_seats`, `acre`, `kunte`.
- Location: `city`, `address`, `landmark`, `googleaddress` (required sub-doc `{lat, long}`).
- Legal/status: `possessionstatus`, `approvalauthority`, `reraregistered` (Bool), `rera_id`.
- Pricing: `expect_price`, `booking_tokenamount`.
- PG-specific: `diet`, `bachelor_allowed`, `occupancy_type` [{occupayname}], `food_provided`, `profession_Type` [String].
- Arrays: `amenities` [{name}], `nearbyplace` [{category, place_name, distance}], `propertyimage` [String paths].
- Owner: `customerId`, `customerName`, `customerNumber`.
- `favorite` (Bool), `timestamps: true`.

### User (`Model/Auth/User.js`) — collection `users`
`userName`, `phonenumber` (Number), `email`, `password` (hashed) — all required; plus required `gender`, `professional`, `socialmedialink` (set via update). No timestamps.

### Adminuser (`Model/Auth/Admin.js`)
`email`, `password` only.

### Enquiry (`Model/Enquiry/Enquiry.js`)
`userName`, `phoneNumber` (Number), `userId` (String), `propertyId` (ObjectId, `ref: "Sellproperty"`), `accepted` (Bool default false).

### Favorite (`Model/Sellproperty/Favorite.js.js`) — collection `favorites`
`customerId`, `customerName`, `propertyId` (ObjectId ref `Property`), `timestamps: true`.

## API Endpoints

### Sell Property — `/api/sell`
- `POST /properties` — create; multipart, field `propertyimage` (≤10 images, ≤10MB, jpg/jpeg/png/webp/gif). JSON string fields (`amenities`, `nearbyplace`, `googleaddress`, `occupancy_type`, `profession_Type`) are parsed.
- `PUT /properties/:id` — update (same upload handling).
- `GET /properties` — all properties.
- `GET /properties/:id` — by id.
- `DELETE /properties/:id` — delete.
- `GET /properties/city?city=` — by city.
- `GET /properties/type?type=` — by type.
- `GET /properties/:propertyId/:customerId/:type` — by combined details.
- `GET /getPropertyByIDandType/:propertyId/:type` — by id + type.
- `PUT /favorite/:propertyId` — toggle `favorite` flag on the property doc.
- `GET /property/favorites/:customerId` — favorited properties for a customer (uses the doc-level flag).
- `POST /search` — rich filtered/paginated/sorted search via aggregation pipeline (price/area/floor numeric ranges via `$convert`, array `$in` filters, regex text search, `nearbyplace` `$elemMatch`, moment-based `dateFilter`, `sortBy`). Returns `{ totalCount, currentPage, totalPages, properties }`.

### Favorites (separate collection) — `/api/favorites`
- `POST /toggle` — body `{customerId, customerName, propertyId}`; adds/removes a Favorite doc.
- `GET /:customerId` — favorites joined with property details via `$lookup`.

### Enquiry — `/api/enquiry`
- `POST /enquiries` — create.
- `GET /enquiries` — all.
- `GET /enquiries/:userId` — by user (populates property).
- `PUT /enquiries/accept/:enquiryId` — set accepted true.
- `PUT /enquiries/reject/:enquiryId` — set accepted false.
- `GET /accepted`, `GET /rejected` — filtered, populated.
- `GET /getallenquiries` — all, populated.
- `GET /enquiries/customer/:customerId` — enquiries whose property belongs to the customer (populate `match` + filter).

### User Auth — `/api`
- `POST /usersignup` — requires userName, phonenumber, password, email; bcrypt-hashes password.
- `POST /usersignin` — email + password; bcrypt compare; returns user data (no token).
- `GET /alluser` — list users.
- `PUT /updateusers/:userId` — update gender/professional/socialmedialink.

### Admin Auth — `/api/admin`
- `POST /signup` — email + password (hashed).
- `POST /signin` — email + password compare.
- `GET /alluser` — list admins.

## Notable Observations / Potential Issues
- **No authentication middleware / tokens.** Sign-in returns user data but no JWT; all endpoints are unprotected. CORS is fully open.
- **Two parallel favorite mechanisms:** a boolean flag on the Property document (`/api/sell/favorite/...`) AND a dedicated `Favorite` collection (`/api/favorites/...`). The Property-level flag is not per-customer, so it is global per listing.
- **Model ref mismatch:** Enquiry's `propertyId` uses `ref: "Sellproperty"` but the registered model is named `"Property"`. The Enquiry controllers work around this by passing `model: Property` explicitly to `.populate()`.
- **Bug in Admin `AdmingetAlluser`:** queries `email.find({})` (undefined `email`) instead of `adminUser.find({})` — this endpoint will throw.
- **Bug in `createProperty`:** the JSON-parse error message uses single quotes `"Invalid JSON format in ${field}"`, so `${field}` is not interpolated.
- **Route ordering risk in Sellproperty:** `GET /properties/:id` is declared before `/properties/city` and `/properties/type`, so requests to `/properties/city` and `/properties/type` are captured by the `:id` route and likely never reach their intended handlers.
- **Unwired/empty features:** `Routes/Pgproperty/`, `Routes/Rentalproperty/`, `Model/Pgproperty/`, `Model/Rentalproperty/` exist but are empty and are NOT imported in `index.js`. PG and rental data is currently handled through the single flexible Property schema. There are also leftover/duplicate controller files (`Sellproperty copy.js`, `Sellproperty copy 2.js`, `Model/Sellproperty/Sellproperty copy.js`).
- **`updateProperty`** overwrites `propertyimage` only when new files are uploaded; otherwise sets it to `undefined`, which Mongoose ignores (existing images retained).
- **User signup** returns the full created user object (including hashed password) in the response.

## Running Locally
1. Create a `.env` with `CONTENT_MONGO_URI=<mongo connection string>` and optionally `PORT`.
2. `npm install`
3. `npm start` (nodemon). Server logs the port and Mongo connection status; check `GET /healthz`.
