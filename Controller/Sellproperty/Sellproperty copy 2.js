const Property = require("../../Model/Sellproperty/Sellproperty");
const moment = require("moment");

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching properties" });
  }
};

exports.toggleFavorite = async (req, res) => {
  const { propertyId } = req.params;

  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.favorite = !property.favorite;

    await property.save();

    res.status(200).json({
      message: `Favorite status updated to ${property.favorite}`,
      favorite: property.favorite,
    });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFavoritePropertiesByCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const favorites = await Property.find({
      customerId,
      favorite: true,
    });

    res.status(200).json(favorites);
  } catch (error) {
    console.error("Error fetching favorite properties:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPropertyById = async (req, res) => {
  const { id } = req.params;
  try {
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching property" });
  }
};

exports.createProperty = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is empty" });
    }
    const propertyData = { ...req.body };
    [
      "amenities",
      "nearbyplace",
      "googleaddress",
      "occupancy_type",
      "profession_Type",
    ].forEach((field) => {
      if (propertyData[field] && typeof propertyData[field] === "string") {
        try {
          propertyData[field] = JSON.parse(propertyData[field]);
        } catch (error) {
          return res.status(400).json({
            message: "Invalid JSON format in ${field}",
            error: error.message,
          });
        }
      }
    });

    if (req.files && req.files.length > 0) {
      propertyData.propertyimage = req.files.map((file) => file.path);
    }

    const property = new Property(propertyData);
    await property.save();

    const savedProperty = await Property.findById(property._id);

    res.status(201).json({
      message: "Property created successfully",
      property: savedProperty,
    });
  } catch (error) {
    console.error("Create Property Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const imagePaths = req.files
      ? req.files.map((file) => file.path)
      : undefined;

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        ...req.body,
        propertyimage: imagePaths ? imagePaths : undefined,
      },
      { new: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: "Property not found to update" });
    }

    res.status(200).json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating property" });
  }
};

exports.deleteProperty = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProperty = await Property.findByIdAndDelete(id);
    if (!deletedProperty) {
      return res.status(404).json({ message: "Property not found to delete" });
    }
    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting property" });
  }
};

exports.getPropertiesByCity = async (req, res) => {
  const { city } = req.query;
  try {
    const properties = await Property.find({ city: city });
    if (properties.length === 0) {
      return res
        .status(404)
        .json({ message: "No properties found for this city" });
    }
    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching properties by city" });
  }
};

exports.getPropertiesByType = async (req, res) => {
  const { type } = req.query;
  try {
    const properties = await Property.find({ type: type });
    if (properties.length === 0) {
      return res
        .status(404)
        .json({ message: "No properties found for this type" });
    }
    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching properties by type" });
  }
};

exports.getPropertyByDetails = async (req, res) => {
  const { propertyId, customerId, type } = req.params;

  try {
    const property = await Property.findOne({
      _id: propertyId,
      customerId: customerId,
      type: type,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found for this customer with the specified type",
      });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching property by propertyId, customerId, and type",
    });
  }
};

exports.getPropertyByIDandType = async (req, res) => {
  const { propertyId, type } = req.params;

  try {
    const property = await Property.findOne({
      _id: propertyId,
      type: type,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found for this customer with the specified type",
      });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching property by propertyId, customerId, and type",
    });
  }
};

// exports.searchProperties = async (req, res) => {
//   try {
//     const {
//       propertytype,
//       type,
//       residentialtype,
//       commercialtype,
//       saletype,
//       sellertype,
//       Facing,
//       Dimensions,
//       totalareaMin,
//       totalareaMax,
//       city,
//       address,
//       landmark,
//       googleaddress,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       possessionstatus,
//       approvalauthority,
//       reraregistered,
//       amenities,
//       expect_price_min,
//       expect_price_max,
//       booking_tokenamount,
//       nearbyplace,
//       floor_no_min,
//       floor_no_max,
//       customerId,
//       customerName,
//       customerNumber,
//       propertyimage,
//       office_seats,
//       acre,
//       kunte,
//       diet,
//       bachelor_allowed,
//       occupancy_type,
//       food_provided,
//       profession_Type,
//       favorite,
//       page = 1,
//       limit = 20,
//       sortBy,
//       dateFilter,
//     } = req.body;

//     const filter = {};

//     if (propertytype) filter.propertytype = propertytype;
//     if (type) filter.type = type;
//     if (Dimensions) filter.Dimensions = Dimensions;
//     if (city) filter.city = city;
//     if (bedrooms) filter.bedrooms = bedrooms;
//     if (possessionstatus) filter.possessionstatus = possessionstatus;
//     if (approvalauthority) filter.approvalauthority = approvalauthority;
//     if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
//     if (customerId) filter.customerId = customerId;
//     if (customerNumber) filter.customerNumber = customerNumber;
//     if (office_seats) filter.office_seats = Number(office_seats);
//     if (acre) filter.acre = acre;
//     if (kunte) filter.kunte = kunte;
//     if (diet) filter.diet = diet;
//     if (bachelor_allowed) filter.bachelor_allowed = bachelor_allowed;
//     if (food_provided) filter.food_provided = food_provided;
//     if (address) filter.address = new RegExp(address, "i");
//     if (landmark) filter.landmark = new RegExp(landmark, "i");
//     if (customerName) filter.customerName = new RegExp(customerName, "i");

//     if (favorite !== undefined)
//       filter.favorite = favorite === true || favorite === "true";
//     if (reraregistered !== undefined)
//       filter.reraregistered =
//         reraregistered === true || reraregistered === "true";

//     if (googleaddress?.lat && googleaddress?.long) {
//       filter["googleaddress.lat"] = googleaddress.lat;
//       filter["googleaddress.long"] = googleaddress.long;
//     }

//     if (Array.isArray(furnishing) && furnishing.length > 0)
//       filter.furnishing = { $in: furnishing };
//     if (Array.isArray(Facing) && Facing.length > 0)
//       filter.Facing = { $in: Facing };
//     if (Array.isArray(bathrooms) && bathrooms.length > 0)
//       filter.bathrooms = { $in: bathrooms };
//     if (Array.isArray(saletype) && saletype.length > 0)
//       filter.saletype = { $in: saletype };
//     if (Array.isArray(sellertype) && sellertype.length > 0)
//       filter.sellertype = { $in: sellertype };
//     if (Array.isArray(residentialtype) && residentialtype.length > 0)
//       filter.residentialtype = { $in: residentialtype };
//     if (Array.isArray(commercialtype) && commercialtype.length > 0)
//       filter.commercialtype = { $in: commercialtype };

//     if (expect_price_min || expect_price_max) {
//       filter.expect_price = {};
//       if (expect_price_min) filter.expect_price.$gte = String(expect_price_min);
//       if (expect_price_max) filter.expect_price.$lte = String(expect_price_max);
//     }

//     if (totalareaMin || totalareaMax) {
//       filter.totalarea = {};
//       if (totalareaMin) filter.totalarea.$gte = String(totalareaMin);
//       if (totalareaMax) filter.totalarea.$lte = String(totalareaMax);
//     }

//     if (floor_no_min || floor_no_max) {
//       filter.floor_no = {};
//       if (floor_no_min) filter.floor_no.$gte = String(floor_no_min);
//       if (floor_no_max) filter.floor_no.$lte = String(floor_no_max);
//     }

//     if (Array.isArray(amenities) && amenities.length > 0) {
//       filter["amenities.name"] = { $all: amenities };
//     }

//     if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
//       filter["occupancy_type.occupayname"] = { $in: occupancy_type };
//     } else if (typeof occupancy_type === "string") {
//       filter["occupancy_type.occupayname"] = occupancy_type;
//     }

//     if (Array.isArray(profession_Type) && profession_Type.length > 0) {
//       filter.profession_Type = { $in: profession_Type };
//     }

//     if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
//       filter.nearbyplace = {
//         $elemMatch: {
//           $or: nearbyplace.map((place) => {
//             const match = {};
//             if (place.category) match.category = place.category;
//             if (place.place_name) match.place_name = place.place_name;
//             if (place.distance) match.distance = place.distance;
//             return match;
//           }),
//         },
//       };
//     }

//     if (dateFilter) {
//       let startDate;
//       const now = moment().endOf("day");

//       switch (dateFilter) {
//         case "yesterday":
//           startDate = moment().subtract(1, "days").startOf("day");
//           break;
//         case "lastWeek":
//           startDate = moment().subtract(7, "days").startOf("day");
//           break;
//         case "last2Weeks":
//           startDate = moment().subtract(14, "days").startOf("day");
//           break;
//         case "lastMonth":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "anyTime":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "last3Months":
//           startDate = moment().subtract(3, "months").startOf("day");
//           break;
//         default:
//           startDate = null;
//       }

//       if (startDate) {
//         filter.createdAt = {
//           $gte: startDate.toDate(),
//           $lte: now.toDate(),
//         };
//       }
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     let sort = {};
//     if (sortBy === "priceLowToHigh") sort.expect_price = 1;
//     else if (sortBy === "priceHighToLow") sort.expect_price = -1;
//     else if (sortBy === "latest") sort.createdAt = -1;

//     const properties = await Property.find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit));

//     const totalCount = await Property.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       totalCount,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//       properties,
//     });
//   } catch (error) {
//     console.error("Search Properties Error:", error);
//     res.status(500).json({ message: "Error searching properties" });
//   }
// };

// Working Code
// exports.searchProperties = async (req, res) => {
//   try {
//     const {
//       propertytype,
//       type,
//       residentialtype,
//       commercialtype,
//       saletype,
//       sellertype,
//       Facing,
//       Dimensions,
//       totalareaMin,
//       totalareaMax,
//       city,
//       address,
//       landmark,
//       googleaddress,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       possessionstatus,
//       approvalauthority,
//       reraregistered,
//       amenities,
//       expect_price_min,
//       expect_price_max,
//       booking_tokenamount,
//       nearbyplace,
//       floor_no_min,
//       floor_no_max,
//       customerId,
//       customerName,
//       customerNumber,
//       propertyimage,
//       office_seats,
//       acre,
//       kunte,
//       diet,
//       bachelor_allowed,
//       occupancy_type,
//       food_provided,
//       profession_Type,
//       favorite,
//       page = 1,
//       limit = 20,
//       sortBy,
//       dateFilter,
//     } = req.body;

//     const filter = {};

//     // Basic field filters
//     if (propertytype) filter.propertytype = propertytype;
//     if (type) filter.type = type;
//     if (Dimensions) filter.Dimensions = Dimensions;
//     if (city) filter.city = city;
//     if (bedrooms) filter.bedrooms = bedrooms;
//     if (possessionstatus) filter.possessionstatus = possessionstatus;
//     if (approvalauthority) filter.approvalauthority = approvalauthority;
//     if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
//     if (customerId) filter.customerId = customerId;
//     if (customerNumber) filter.customerNumber = customerNumber;
//     if (office_seats) filter.office_seats = Number(office_seats);
//     if (acre) filter.acre = acre;
//     if (kunte) filter.kunte = kunte;
//     if (diet) filter.diet = diet;
//     if (bachelor_allowed) filter.bachelor_allowed = bachelor_allowed;
//     if (food_provided) filter.food_provided = food_provided;
//     if (address) filter.address = new RegExp(address, "i");
//     if (landmark) filter.landmark = new RegExp(landmark, "i");
//     if (customerName) filter.customerName = new RegExp(customerName, "i");

//     // Boolean filters
//     if (favorite !== undefined)
//       filter.favorite = favorite === true || favorite === "true";
//     if (reraregistered !== undefined)
//       filter.reraregistered =
//         reraregistered === true || reraregistered === "true";

//     // Google address filter
//     if (googleaddress?.lat && googleaddress?.long) {
//       filter["googleaddress.lat"] = googleaddress.lat;
//       filter["googleaddress.long"] = googleaddress.long;
//     }

//     // Array filters
//     if (Array.isArray(furnishing) && furnishing.length > 0)
//       filter.furnishing = { $in: furnishing };
//     if (Array.isArray(Facing) && Facing.length > 0)
//       filter.Facing = { $in: Facing };
//     if (Array.isArray(bathrooms) && bathrooms.length > 0)
//       filter.bathrooms = { $in: bathrooms };
//     if (Array.isArray(saletype) && saletype.length > 0)
//       filter.saletype = { $in: saletype };
//     if (Array.isArray(sellertype) && sellertype.length > 0)
//       filter.sellertype = { $in: sellertype };
//     if (Array.isArray(residentialtype) && residentialtype.length > 0)
//       filter.residentialtype = { $in: residentialtype };
//     if (Array.isArray(commercialtype) && commercialtype.length > 0)
//       filter.commercialtype = { $in: commercialtype };

//     // Numerical range filters (converted to numbers)
//     if (expect_price_min || expect_price_max) {
//       filter.expect_price = {};
//       if (expect_price_min) filter.expect_price.$gte = String(expect_price_min);
//       if (expect_price_max) filter.expect_price.$lte = String(expect_price_max);
//     }

//     if (totalareaMin || totalareaMax) {
//       filter.totalarea = {};
//       if (totalareaMin) filter.totalarea.$gte = String(totalareaMin);
//       if (totalareaMax) filter.totalarea.$lte = String(totalareaMax);
//     }

//     if (floor_no_min || floor_no_max) {
//       filter.floor_no = {};
//       if (floor_no_min) filter.floor_no.$gte = String(floor_no_min);
//       if (floor_no_max) filter.floor_no.$lte = String(floor_no_max);
//     }

//     // Amenities filter
//     if (Array.isArray(amenities) && amenities.length > 0) {
//       filter["amenities.name"] = { $all: amenities };
//     }

//     // Occupancy type filter
//     if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
//       filter["occupancy_type.occupayname"] = { $in: occupancy_type };
//     } else if (typeof occupancy_type === "string") {
//       filter["occupancy_type.occupayname"] = occupancy_type;
//     }

//     // Profession type filter
//     if (Array.isArray(profession_Type) && profession_Type.length > 0) {
//       filter.profession_Type = { $in: profession_Type };
//     }

//     // Nearby place filter
//     if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
//       filter.nearbyplace = {
//         $elemMatch: {
//           $or: nearbyplace.map((place) => {
//             const match = {};
//             if (place.category) match.category = place.category;
//             if (place.place_name) match.place_name = place.place_name;
//             if (place.distance) match.distance = place.distance;
//             return match;
//           }),
//         },
//       };
//     }

//     // Date filter
//     if (dateFilter) {
//       let startDate;
//       const now = moment().endOf("day");

//       switch (dateFilter) {
//         case "yesterday":
//           startDate = moment().subtract(1, "days").startOf("day");
//           break;
//         case "lastWeek":
//           startDate = moment().subtract(7, "days").startOf("day");
//           break;
//         case "last2Weeks":
//           startDate = moment().subtract(14, "days").startOf("day");
//           break;
//         case "lastMonth":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "anyTime":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "last3Months":
//           startDate = moment().subtract(3, "months").startOf("day");
//           break;
//         default:
//           startDate = null;
//       }

//       if (startDate) {
//         filter.createdAt = {
//           $gte: startDate.toDate(),
//           $lte: now.toDate(),
//         };
//       }
//     }

//     // Sorting
//     let sort = {};
//     if (sortBy === "priceLowToHigh") sort.expect_price = 1;
//     else if (sortBy === "priceHighToLow") sort.expect_price = -1;
//     else if (sortBy === "latest") sort.createdAt = -1;

//     // Use aggregation pipeline to handle numerical comparisons for string fields
//     const properties = await Property.aggregate([
//       // Convert string fields to numbers for comparison
//       {
//         $addFields: {
//           expect_price_num: { $toDouble: "$expect_price" },
//           totalarea_num: { $toDouble: "$totalarea" },
//           floor_no_num: { $toDouble: "$floor_no" },
//         },
//       },
//       // Apply filters
//       {
//         $match: {
//           ...filter,
//           // Override string-based price and area filters with numerical ones
//           ...(expect_price_min || expect_price_max
//             ? {
//                 expect_price_num: {
//                   ...(expect_price_min
//                     ? { $gte: Number(expect_price_min) }
//                     : {}),
//                   ...(expect_price_max
//                     ? { $lte: Number(expect_price_max) }
//                     : {}),
//                 },
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 totalarea_num: {
//                   ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                   ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                 },
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 floor_no_num: {
//                   ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                   ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                 },
//               }
//             : {}),
//         },
//       },
//       // Sort
//       { $sort: sort },
//       // Pagination
//       { $skip: (parseInt(page) - 1) * parseInt(limit) },
//       { $limit: parseInt(limit) },
//       // Remove temporary numerical fields
//       {
//         $project: {
//           expect_price_num: 0,
//           totalarea_num: 0,
//           floor_no_num: 0,
//         },
//       },
//     ]);

//     // Count total documents
//     const totalCount = await Property.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       totalCount,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//       properties,
//     });
//   } catch (error) {
//     console.error("Search Properties Error:", error);
//     res.status(500).json({ message: "Error searching properties" });
//   }
// };

// working code array format
// exports.searchProperties = async (req, res) => {
//   try {
//     const {
//       propertytype,
//       type,
//       residentialtype,
//       commercialtype,
//       saletype,
//       sellertype,
//       Facing,
//       Dimensions,
//       totalareaMin,
//       totalareaMax,
//       city,
//       address,
//       landmark,
//       googleaddress,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       possessionstatus,
//       approvalauthority,
//       reraregistered,
//       amenities,
//       expect_price_min,
//       expect_price_max,
//       booking_tokenamount,
//       nearbyplace,
//       floor_no_min,
//       floor_no_max,
//       customerId,
//       customerName,
//       customerNumber,
//       propertyimage,
//       office_seats,
//       acre,
//       kunte,
//       diet,
//       bachelor_allowed,
//       occupancy_type,
//       food_provided,
//       profession_Type,
//       favorite,
//       page = 1,
//       limit = 20,
//       sortBy,
//       dateFilter,
//     } = req.body;

//     const filter = {};

//     // Basic field filters
//     if (propertytype) filter.propertytype = propertytype;
//     if (type) filter.type = type;
//     if (Dimensions) filter.Dimensions = Dimensions;
//     if (city) filter.city = city;
//     if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
//     if (customerId) filter.customerId = customerId;
//     if (customerNumber) filter.customerNumber = customerNumber;
//     if (office_seats) filter.office_seats = Number(office_seats);
//     if (acre) filter.acre = acre;
//     if (kunte) filter.kunte = kunte;
//     if (diet) filter.diet = diet;
//     if (bachelor_allowed) filter.bachelor_allowed = bachelor_allowed;
//     if (food_provided) filter.food_provided = food_provided;
//     if (address) filter.address = new RegExp(address, "i");
//     if (landmark) filter.landmark = new RegExp(landmark, "i");
//     if (customerName) filter.customerName = new RegExp(customerName, "i");

//     // Boolean filters
//     if (favorite !== undefined)
//       filter.favorite = favorite === true || favorite === "true";
//     if (reraregistered !== undefined)
//       filter.reraregistered =
//         reraregistered === true || reraregistered === "true";

//     // Google address filter
//     if (googleaddress?.lat && googleaddress?.long) {
//       filter["googleaddress.lat"] = googleaddress.lat;
//       filter["googleaddress.long"] = googleaddress.long;
//     }

//     // Array filters
//     if (Array.isArray(furnishing) && furnishing.length > 0)
//       filter.furnishing = { $in: furnishing };
//     if (Array.isArray(Facing) && Facing.length > 0)
//       filter.Facing = { $in: Facing };
//     if (Array.isArray(bathrooms) && bathrooms.length > 0)
//       filter.bathrooms = { $in: bathrooms };
//     if (Array.isArray(saletype) && saletype.length > 0)
//       filter.saletype = { $in: saletype };
//     if (Array.isArray(sellertype) && sellertype.length > 0)
//       filter.sellertype = { $in: sellertype };
//     if (Array.isArray(residentialtype) && residentialtype.length > 0)
//       filter.residentialtype = { $in: residentialtype };
//     if (Array.isArray(commercialtype) && commercialtype.length > 0)
//       filter.commercialtype = { $in: commercialtype };
//     if (Array.isArray(possessionstatus) && possessionstatus.length > 0)
//       filter.possessionstatus = { $in: possessionstatus };
//     else if (typeof possessionstatus === "string")
//       filter.possessionstatus = possessionstatus;
//     if (Array.isArray(approvalauthority) && approvalauthority.length > 0)
//       filter.approvalauthority = { $in: approvalauthority };
//     else if (typeof approvalauthority === "string")
//       filter.approvalauthority = approvalauthority;
//     if (Array.isArray(bedrooms) && bedrooms.length > 0)
//       filter.bedrooms = { $in: bedrooms };
//     else if (typeof bedrooms === "string") filter.bedrooms = bedrooms;

//     // Numerical range filters (handled in aggregation pipeline)
//     if (expect_price_min || expect_price_max) {
//       filter.expect_price = {};
//       if (expect_price_min) filter.expect_price.$gte = String(expect_price_min);
//       if (expect_price_max) filter.expect_price.$lte = String(expect_price_max);
//     }

//     if (totalareaMin || totalareaMax) {
//       filter.totalarea = {};
//       if (totalareaMin) filter.totalarea.$gte = String(totalareaMin);
//       if (totalareaMax) filter.totalarea.$lte = String(totalareaMax);
//     }

//     if (floor_no_min || floor_no_max) {
//       filter.floor_no = {};
//       if (floor_no_min) filter.floor_no.$gte = String(floor_no_min);
//       if (floor_no_max) filter.floor_no.$lte = String(floor_no_max);
//     }

//     // Amenities filter
//     if (Array.isArray(amenities) && amenities.length > 0) {
//       filter["amenities.name"] = { $all: amenities };
//     }

//     // Occupancy type filter
//     if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
//       filter["occupancy_type.occupayname"] = { $in: occupancy_type };
//     } else if (typeof occupancy_type === "string") {
//       filter["occupancy_type.occupayname"] = occupancy_type;
//     }

//     // Profession type filter
//     if (Array.isArray(profession_Type) && profession_Type.length > 0) {
//       filter.profession_Type = { $in: profession_Type };
//     }

//     // Nearby place filter
//     if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
//       filter.nearbyplace = {
//         $elemMatch: {
//           $or: nearbyplace.map((place) => {
//             const match = {};
//             if (place.category) match.category = place.category;
//             if (place.place_name) match.place_name = place.place_name;
//             if (place.distance) match.distance = place.distance;
//             return match;
//           }),
//         },
//       };
//     }

//     // Date filter
//     if (dateFilter) {
//       let startDate;
//       const now = moment().endOf("day");

//       switch (dateFilter) {
//         case "yesterday":
//           startDate = moment().subtract(1, "days").startOf("day");
//           break;
//         case "lastWeek":
//           startDate = moment().subtract(7, "days").startOf("day");
//           break;
//         case "last2Weeks":
//           startDate = moment().subtract(14, "days").startOf("day");
//           break;
//         case "lastMonth":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "anyTime":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "last3Months":
//           startDate = moment().subtract(3, "months").startOf("day");
//           break;
//         default:
//           startDate = null;
//       }

//       if (startDate) {
//         filter.createdAt = {
//           $gte: startDate.toDate(),
//           $lte: now.toDate(),
//         };
//       }
//     }

//     // Sorting
//     let sort = {};
//     if (sortBy === "priceLowToHigh") sort.expect_price_num = 1;
//     else if (sortBy === "priceHighToLow") sort.expect_price_num = -1;
//     else if (sortBy === "latest") sort.createdAt = -1;

//     // Use aggregation pipeline to handle numerical comparisons
//     const properties = await Property.aggregate([
//       // Convert string fields to numbers for comparison
//       {
//         $addFields: {
//           expect_price_num: {
//             $cond: {
//               if: { $eq: ["$expect_price", ""] },
//               then: null,
//               else: { $toDouble: "$expect_price" },
//             },
//           },
//           totalarea_num: {
//             $cond: {
//               if: { $eq: ["$totalarea", ""] },
//               then: null,
//               else: { $toDouble: "$totalarea" },
//             },
//           },
//           floor_no_num: {
//             $cond: {
//               if: { $eq: ["$floor_no", ""] },
//               then: null,
//               else: { $toDouble: "$floor_no" },
//             },
//           },
//         },
//       },
//       // Apply filters
//       {
//         $match: {
//           ...filter,
//           // Override string-based price and area filters with numerical ones
//           ...(expect_price_min || expect_price_max
//             ? {
//                 expect_price_num: {
//                   ...(expect_price_min
//                     ? { $gte: Number(expect_price_min) }
//                     : {}),
//                   ...(expect_price_max
//                     ? { $lte: Number(expect_price_max) }
//                     : {}),
//                 },
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 totalarea_num: {
//                   ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                   ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                 },
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 floor_no_num: {
//                   ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                   ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                 },
//               }
//             : {}),
//         },
//       },
//       // Sort
//       { $sort: sort },
//       // Pagination
//       { $skip: (parseInt(page) - 1) * parseInt(limit) },
//       { $limit: parseInt(limit) },
//       // Remove temporary numerical fields
//       {
//         $project: {
//           expect_price_num: 0,
//           totalarea_num: 0,
//           floor_no_num: 0,
//         },
//       },
//     ]);

//     // Count total documents
//     const totalCount = await Property.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       totalCount,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//       properties,
//     });
//   } catch (error) {
//     console.error("Search Properties Error:", error);
//     res.status(500).json({ message: "Error searching properties" });
//   }
// };

exports.searchProperties = async (req, res) => {
  try {
    const {
      propertytype,
      type,
      residentialtype,
      commercialtype,
      saletype,
      sellertype,
      Facing,
      Dimensions,
      totalareaMin,
      totalareaMax,
      city,
      address,
      landmark,
      googleaddress,
      bedrooms,
      bathrooms,
      furnishing,
      possessionstatus,
      approvalauthority,
      reraregistered,
      amenities,
      expect_price_min,
      expect_price_max,
      booking_tokenamount,
      nearbyplace,
      floor_no_min,
      floor_no_max,
      customerId,
      customerName,
      customerNumber,
      propertyimage,
      office_seats,
      acre,
      kunte,
      diet,
      bachelor_allowed,
      occupancy_type,
      food_provided,
      profession_Type,
      favorite,
      page = 1,
      limit = 20,
      sortBy,
      dateFilter,
    } = req.body;

    const filter = {};

    // Basic field filters
    if (propertytype) filter.propertytype = propertytype;
    if (type) filter.type = type;
    if (Dimensions) filter.Dimensions = Dimensions;
    if (city) filter.city = city;
    if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
    if (customerId) filter.customerId = customerId;
    if (customerNumber) filter.customerNumber = customerNumber;
    if (office_seats) filter.office_seats = Number(office_seats);
    if (acre) filter.acre = acre;
    if (kunte) filter.kunte = kunte;
    if (diet) filter.diet = diet;
    if (bachelor_allowed) filter.bachelor_allowed = bachelor_allowed;
    if (food_provided) filter.food_provided = food_provided;
    if (address) filter.address = new RegExp(address, "i");
    if (landmark) filter.landmark926 = new RegExp(landmark, "i");
    if (customerName) filter.customerName = new RegExp(customerName, "i");

    // Boolean filters
    if (favorite !== undefined)
      filter.favorite = favorite === true || favorite === "true";
    if (reraregistered !== undefined)
      filter.reraregistered =
        reraregistered === true || reraregistered === "true";

    // Google address filter
    if (googleaddress?.lat && googleaddress?.long) {
      filter["googleaddress.lat"] = googleaddress.lat;
      filter["googleaddress.long"] = googleaddress.long;
    }

    // Array filters
    if (Array.isArray(furnishing) && furnishing.length > 0)
      filter.furnishing = { $in: furnishing };
    if (Array.isArray(Facing) && Facing.length > 0)
      filter.Facing = { $in: Facing };
    if (Array.isArray(bathrooms) && bathrooms.length > 0)
      filter.bathrooms = { $in: bathrooms };
    if (Array.isArray(saletype) && saletype.length > 0)
      filter.saletype = { $in: saletype };
    if (Array.isArray(sellertype) && sellertype.length > 0)
      filter.sellertype = { $in: sellertype };
    if (Array.isArray(residentialtype) && residentialtype.length > 0)
      filter.residentialtype = { $in: residentialtype };
    if (Array.isArray(commercialtype) && commercialtype.length > 0)
      filter.commercialtype = { $in: commercialtype };
    if (Array.isArray(possessionstatus) && possessionstatus.length > 0)
      filter.possessionstatus = { $in: possessionstatus };
    else if (typeof possessionstatus === "string")
      filter.possessionstatus = possessionstatus;
    if (Array.isArray(approvalauthority) && approvalauthority.length > 0)
      filter.approvalauthority = { $in: approvalauthority };
    else if (typeof approvalauthority === "string")
      filter.approvalauthority = approvalauthority;
    if (Array.isArray(bedrooms) && bedrooms.length > 0)
      filter.bedrooms = { $in: bedrooms };
    else if (typeof bedrooms === "string") filter.bedrooms = bedrooms;

    // Numerical range filters
    if (expect_price_min || expect_price_max) {
      filter.expect_price = {};
      if (expect_price_min) filter.expect_price.$gte = String(expect_price_min);
      if (expect_price_max) filter.expect_price.$lte = String(expect_price_max);
    }

    if (totalareaMin || totalareaMax) {
      filter.totalarea = {};
      if (totalareaMin) filter.totalarea.$gte = String(totalareaMin);
      if (totalareaMax) filter.totalarea.$lte = String(totalareaMax);
    }

    if (floor_no_min || floor_no_max) {
      filter.floor_no = {};
      if (floor_no_min) filter.floor_no.$gte = String(floor_no_min);
      if (floor_no_max) filter.floor_no.$lte = String(floor_no_max);
    }

    // Amenities filter
    if (Array.isArray(amenities) && amenities.length > 0) {
      filter["amenities.name"] = { $all: amenities };
    }

    // Occupancy type filter
    if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
      filter["occupancy_type.occupayname"] = { $in: occupancy_type };
    } else if (typeof occupancy_type === "string") {
      filter["occupancy_type.occupayname"] = occupancy_type;
    }

    // Profession type filter
    if (Array.isArray(profession_Type) && profession_Type.length > 0) {
      filter.profession_Type = { $in: profession_Type };
    }

    // Nearby place filter
    if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
      filter.nearbyplace = {
        $elemMatch: {
          $or: nearbyplace.map((place) => {
            const match = {};
            if (place.category) match.category = place.category;
            if (place.place_name) match.place_name = place.place_name;
            if (place.distance) match.distance = place.distance;
            return match;
          }),
        },
      };
    }

    // Date filter
    if (dateFilter) {
      let startDate;
      const now = moment().endOf("day");

      switch (dateFilter) {
        case "yesterday":
          startDate = moment().subtract(1, "days").startOf("day");
          break;
        case "lastWeek":
          startDate = moment().subtract(7, "days").startOf("day");
          break;
        case "last2Weeks":
          startDate = moment().subtract(14, "days").startOf("day");
          break;
        case "lastMonth":
          startDate = moment().subtract(1, "months").startOf("day");
          break;
        case "anyTime":
          startDate = moment().subtract(1, "months").startOf("day");
          break;
        case "last3Months":
          startDate = moment().subtract(3, "months").startOf("day");
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filter.createdAt = {
          $gte: startDate.toDate(),
          $lte: now.toDate(),
        };
      }
    }

    // Sorting with default
    let sort = { createdAt: -1 }; // Default sort by latest
    if (sortBy === "priceLowToHigh") sort = { expect_price_num: 1 };
    else if (sortBy === "priceHighToLow") sort = { expect_price_num: -1 };
    else if (sortBy === "latest") sort = { createdAt: -1 };

    // Use aggregation pipeline to handle numerical comparisons
    const properties = await Property.aggregate([
      // Convert string fields to numbers for comparison
      {
        $addFields: {
          expect_price_num: {
            $cond: {
              if: { $eq: ["$expect_price", ""] },
              then: null,
              else: { $toDouble: "$expect_price" },
            },
          },
          totalarea_num: {
            $cond: {
              if: { $eq: ["$totalarea", ""] },
              then: null,
              else: { $toDouble: "$totalarea" },
            },
          },
          floor_no_num: {
            $cond: {
              if: { $eq: ["$floor_no", ""] },
              then: null,
              else: { $toDouble: "$floor_no" },
            },
          },
        },
      },
      // Apply filters
      {
        $match: {
          ...filter,
          ...(expect_price_min || expect_price_max
            ? {
                expect_price_num: {
                  ...(expect_price_min
                    ? { $gte: Number(expect_price_min) }
                    : {}),
                  ...(expect_price_max
                    ? { $lte: Number(expect_price_max) }
                    : {}),
                },
              }
            : {}),
          ...(totalareaMin || totalareaMax
            ? {
                totalarea_num: {
                  ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
                  ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
                },
              }
            : {}),
          ...(floor_no_min || floor_no_max
            ? {
                floor_no_num: {
                  ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
                  ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
                },
              }
            : {}),
        },
      },
      // Sort
      { $sort: sort },
      // Pagination
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      // Remove temporary numerical fields
      {
        $project: {
          expect_price_num: 0,
          totalarea_num: 0,
          floor_no_num: 0,
        },
      },
    ]);

    // Count total documents
    const totalCount = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      properties,
    });
  } catch (error) {
    console.error("Search Properties Error:", error);
    res.status(500).json({ message: "Error searching properties" });
  }
};

// exports.searchProperties = async (req, res) => {
//   try {
//     const {
//       propertytype,
//       type,
//       residentialtype,
//       commercialtype,
//       saletype,
//       sellertype,
//       Facing,
//       Dimensions,
//       totalareaMin,
//       totalareaMax,
//       city,
//       address,
//       landmark,
//       googleaddress,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       possessionstatus,
//       approvalauthority,
//       reraregistered,
//       amenities,
//       expect_price_min,
//       expect_price_max,
//       booking_tokenamount,
//       nearbyplace,
//       floor_no_min,
//       floor_no_max,
//       customerId,
//       customerName,
//       customerNumber,
//       propertyimage,
//       office_seats,
//       acre,
//       kunte,
//       diet,
//       bachelor_allowed,
//       occupancy_type,
//       food_provided,
//       profession_Type,
//       favorite,
//       page = 1,
//       limit = 20,
//       sortBy,
//       dateFilter,
//     } = req.body;

//     const filter = {};

//     // Basic field filters
//     if (propertytype) filter.propertytype = propertytype;
//     if (type) filter.type = type;
//     if (Dimensions) filter.Dimensions = Dimensions;
//     if (city) filter.city = city;
//     if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
//     if (customerId) filter.customerId = customerId;
//     if (customerNumber) filter.customerNumber = customerNumber;
//     if (office_seats) filter.office_seats = Number(office_seats);
//     if (acre) filter.acre = acre;
//     if (kunte) filter.kunte = kunte;
//     if (diet) filter.diet = diet;
//     if (bachelor_allowed) filter.bachelor_allowed = bachelor_allowed;
//     if (food_provided) filter.food_provided = food_provided;
//     if (address) filter.address = new RegExp(address, "i");
//     if (landmark) filter.landmark = new RegExp(landmark, "i");
//     if (customerName) filter.customerName = new RegExp(customerName, "i");

//     // Boolean filters
//     if (favorite !== undefined)
//       filter.favorite = favorite === true || favorite === "true";
//     if (reraregistered !== undefined)
//       filter.reraregistered =
//         reraregistered === true || reraregistered === "true";

//     // Google address filter
//     if (googleaddress?.lat && googleaddress?.long) {
//       filter["googleaddress.lat"] = googleaddress.lat;
//       filter["googleaddress.long"] = googleaddress.long;
//     }

//     // Array filters
//     if (Array.isArray(furnishing) && furnishing.length > 0)
//       filter.furnishing = { $in: furnishing };
//     if (Array.isArray(Facing) && Facing.length > 0)
//       filter.Facing = { $in: Facing };
//     if (Array.isArray(bathrooms) && bathrooms.length > 0)
//       filter.bathrooms = { $in: bathrooms };
//     if (Array.isArray(saletype) && saletype.length > 0)
//       filter.saletype = { $in: saletype };
//     if (Array.isArray(sellertype) && sellertype.length > 0)
//       filter.sellertype = { $in: sellertype };
//     if (Array.isArray(residentialtype) && residentialtype.length > 0)
//       filter.residentialtype = { $in: residentialtype };
//     else if (typeof residentialtype === "string")
//       filter.residentialtype = residentialtype;
//     if (Array.isArray(commercialtype) && commercialtype.length > 0)
//       filter.commercialtype = { $in: commercialtype };
//     if (Array.isArray(possessionstatus) && possessionstatus.length > 0)
//       filter.possessionstatus = { $in: possessionstatus };
//     else if (typeof possessionstatus === "string")
//       filter.possessionstatus = possessionstatus;
//     if (Array.isArray(approvalauthority) && approvalauthority.length > 0)
//       filter.approvalauthority = { $in: approvalauthority };
//     else if (typeof approvalauthority === "string")
//       filter.approvalauthority = approvalauthority;
//     if (Array.isArray(bedrooms) && bedrooms.length > 0)
//       filter.bedrooms = { $in: bedrooms };
//     else if (typeof bedrooms === "string") filter.bedrooms = bedrooms;

//     // Numerical range filters for totalarea and floor_no (handled in aggregation pipeline)
//     if (totalareaMin || totalareaMax) {
//       filter.totalarea = {};
//       if (totalareaMin) filter.totalarea.$gte = String(totalareaMin);
//       if (totalareaMax) filter.totalarea.$lte = String(totalareaMax);
//     }

//     if (floor_no_min || floor_no_max) {
//       filter.floor_no = {};
//       if (floor_no_min) filter.floor_no.$gte = String(floor_no_min);
//       if (floor_no_max) filter.floor_no.$lte = String(floor_no_max);
//     }

//     // Amenities filter
//     if (Array.isArray(amenities) && amenities.length > 0) {
//       filter["amenities.name"] = { $all: amenities };
//     }

//     // Occupancy type filter
//     if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
//       filter["occupancy_type.occupayname"] = { $in: occupancy_type };
//     } else if (typeof occupancy_type === "string") {
//       filter["occupancy_type.occupayname"] = occupancy_type;
//     }

//     // Profession type filter
//     if (Array.isArray(profession_Type) && profession_Type.length > 0) {
//       filter.profession_Type = { $in: profession_Type };
//     }

//     // Nearby place filter
//     if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
//       filter.nearbyplace = {
//         $elemMatch: {
//           $or: nearbyplace.map((place) => {
//             const match = {};
//             if (place.category) match.category = place.category;
//             if (place.place_name) match.place_name = place.place_name;
//             if (place.distance) match.distance = place.distance;
//             return match;
//           }),
//         },
//       };
//     }

//     // Date filter
//     if (dateFilter) {
//       let startDate;
//       const now = moment().endOf("day");

//       switch (dateFilter) {
//         case "yesterday":
//           startDate = moment().subtract(1, "days").startOf("day");
//           break;
//         case "lastWeek":
//           startDate = moment().subtract(7, "days").startOf("day");
//           break;
//         case "last2Weeks":
//           startDate = moment().subtract(14, "days").startOf("day");
//           break;
//         case "lastMonth":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "anyTime":
//           startDate = moment().subtract(1, "months").startOf("day");
//           break;
//         case "last3Months":
//           startDate = moment().subtract(3, "months").startOf("day");
//           break;
//         default:
//           startDate = null;
//       }

//       if (startDate) {
//         filter.createdAt = {
//           $gte: startDate.toDate(),
//           $lte: now.toDate(),
//         };
//       }
//     }

//     // Sorting
//     let sort = {};
//     if (sortBy === "priceLowToHigh") sort.expect_price_num = 1;
//     else if (sortBy === "priceHighToLow") sort.expect_price_num = -1;
//     else if (sortBy === "latest") sort.createdAt = -1;

//     // Use aggregation pipeline to handle numerical comparisons
//     const properties = await Property.aggregate([
//       // Convert string fields to numbers for comparison
//       {
//         $addFields: {
//           expect_price_num: {
//             $cond: {
//               if: {
//                 $or: [
//                   { $eq: ["$expect_price", ""] },
//                   { $eq: ["$expect_price", null] },
//                 ],
//               },
//               then: null,
//               else: { $toDouble: "$expect_price" },
//             },
//           },
//           totalarea_num: {
//             $cond: {
//               if: {
//                 $or: [
//                   { $eq: ["$totalarea", ""] },
//                   { $eq: ["$totalarea", null] },
//                 ],
//               },
//               then: null,
//               else: { $toDouble: "$totalarea" },
//             },
//           },
//           floor_no_num: {
//             $cond: {
//               if: {
//                 $or: [{ $eq: ["$floor_no", ""] }, { $eq: ["$floor_no", null] }],
//               },
//               then: null,
//               else: { $toDouble: "$floor_no" },
//             },
//           },
//         },
//       },
//       // Apply filters
//       {
//         $match: {
//           ...filter,

//           ...(expect_price_min || expect_price_max
//             ? {
//                 expect_price_num: {
//                   ...(expect_price_min
//                     ? { $gte: Number(expect_price_min) }
//                     : {}),
//                   ...(expect_price_max
//                     ? { $lte: Number(expect_price_max) }
//                     : {}),
//                 },
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 totalarea_num: {
//                   ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                   ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                 },
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 floor_no_num: {
//                   ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                   ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                 },
//               }
//             : {}),
//         },
//       },
//       // Sort
//       { $sort: sort },
//       // Pagination
//       { $skip: (parseInt(page) - 1) * parseInt(limit) },
//       { $limit: parseInt(limit) },
//       // Remove temporary numerical fields
//       {
//         $project: {
//           expect_price_num: 0,
//           totalarea_num: 0,
//           floor_no_num: 0,
//         },
//       },
//     ]);

//     // Count total documents (apply same numerical filters for consistency)
//     const countPipeline = [
//       {
//         $addFields: {
//           expect_price_num: {
//             $cond: {
//               if: {
//                 $or: [
//                   { $eq: ["$expect_price", ""] },
//                   { $eq: ["$expect_price", null] },
//                 ],
//               },
//               then: null,
//               else: { $toDouble: "$expect_price" },
//             },
//           },
//           totalarea_num: {
//             $cond: {
//               if: {
//                 $or: [
//                   { $eq: ["$totalarea", ""] },
//                   { $eq: ["$totalarea", null] },
//                 ],
//               },
//               then: null,
//               else: { $toDouble: "$totalarea" },
//             },
//           },
//           floor_no_num: {
//             $cond: {
//               if: {
//                 $or: [{ $eq: ["$floor_no", ""] }, { $eq: ["$floor_no", null] }],
//               },
//               then: null,
//               else: { $toDouble: "$floor_no" },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           ...filter,
//           ...(expect_price_min || expect_price_max
//             ? {
//                 expect_price_num: {
//                   ...(expect_price_min
//                     ? { $gte: Number(expect_price_min) }
//                     : {}),
//                   ...(expect_price_max
//                     ? { $lte: Number(expect_price_max) }
//                     : {}),
//                 },
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 totalarea_num: {
//                   ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                   ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                 },
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 floor_no_num: {
//                   ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                   ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                 },
//               }
//             : {}),
//         },
//       },
//       { $count: "totalCount" },
//     ];

//     const countResult = await Property.aggregate(countPipeline);
//     const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

//     res.status(200).json({
//       success: true,
//       totalCount,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalCount / parseInt(limit)),
//       properties,
//     });
//   } catch (error) {
//     console.error("Search Properties Error:", error);
//     res
//       .status(500)
//       .json({ message: "Error searching properties", error: error.message });
//   }
// };
