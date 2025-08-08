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
    occupancy_type: {
      type: String,
    },
    food_provided: { type: String },
    profession_Type: { type: String },
    favorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", PropertySchema);

module.exports = Property;
