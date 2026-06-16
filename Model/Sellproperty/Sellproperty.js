const mongoose = require("mongoose");

const NearbyPlaceSchema = new mongoose.Schema({
  category: { type: String, required: true },
  place_name: { type: String, required: true },
  distance: { type: String, required: true },
});

const AmenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const GoogleAddressSchema = new mongoose.Schema({
  lat: { type: String, required: true },
  long: { type: String, required: true },
});

const OccupancyTypeSchema = new mongoose.Schema(
  {
    occupayname: { type: String },
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    propertytype: { type: String, required: true },
    type: { type: String },
    residentialtype: { type: String },
    commercialtype: { type: String },
    saletype: { type: String },
    sellertype: { type: String },
    Facing: { type: String },
    Dimensions: { type: String },
    totalarea: { type: String },
    city: { type: String },
    address: { type: String },
    landmark: { type: String },
    googleaddress: { type: GoogleAddressSchema, required: true },
    bedrooms: { type: String },
    bathrooms: { type: String },
    furnishing: { type: String },
    possessionstatus: { type: String },
    approvalauthority: { type: String },
    reraregistered: { type: Boolean, default: false },
    amenities: [AmenitySchema],
    expect_price: { type: String },
    booking_tokenamount: { type: String },
    nearbyplace: [NearbyPlaceSchema],
    floor_no: { type: String },
    customerId: { type: String },
    customerName: { type: String },
    customerNumber: { type: String },
    propertyimage: [{ type: String }],
    office_seats: { type: Number },
    acre: { type: String },
    kunte: { type: String },
    diet: { type: String },
    bachelor_allowed: { type: String },
    occupancy_type: [OccupancyTypeSchema],
    food_provided: { type: String },
    profession_Type: [{ type: String }],
    favorite: { type: Boolean, default: false },
    rera_id: { type: String },
    // ---- Admin moderation fields ----
    // Listings default to "approved" so existing app behaviour is unchanged;
    // an admin can move a listing to "pending"/"rejected" to hide it.
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    // Promoted listings the admin wants surfaced first.
    featured: { type: Boolean, default: false },
    // Soft on/off switch independent of approval (e.g. temporarily delist).
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", PropertySchema);

module.exports = Property;
