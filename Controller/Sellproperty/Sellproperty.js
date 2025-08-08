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
//     if (Array.isArray(possessionstatus) && possessionstatus.length > 0)
//       filter.possessionstatus = { $in: possessionstatus };
//     if (Array.isArray(approvalauthority) && approvalauthority.length > 0)
//       filter.approvalauthority = { $in: approvalauthority };
//     if (Array.isArray(bedrooms) && bedrooms.length > 0)
//       filter.bedrooms = { $in: bedrooms };
//     if (Array.isArray(amenities) && amenities.length > 0) {
//       filter["amenities.name"] = { $all: amenities };
//     }
//     if (Array.isArray(occupancy_type) && occupancy_type.length > 0) {
//       filter["occupancy_type.occupayname"] = { $in: occupancy_type };
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
//           startDate = null;
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

//     let sort = { createdAt: -1 };
//     if (sortBy === "priceLowToHigh") sort = { expect_price_num: 1 };
//     else if (sortBy === "priceHighToLow") sort = { expect_price_num: -1 };
//     else if (sortBy === "latest") sort = { createdAt: -1 };

//     const properties = await Property.aggregate([
//       {
//         $addFields: {
//           expect_price_num: {
//             $convert: { input: "$expect_price", to: "double", onError: 0 },
//           },
//           totalarea_num: {
//             $convert: { input: "$totalarea", to: "double", onError: 0 },
//           },
//           floor_no_num: {
//             $convert: { input: "$floor_no", to: "double", onError: 0 },
//           },
//         },
//       },
//       {
//         $match: {
//           ...filter,
//           ...(expect_price_min || expect_price_max
//             ? {
//                 $or: [
//                   {
//                     expect_price_num: {
//                       ...(expect_price_min
//                         ? { $gte: Number(expect_price_min) }
//                         : {}),
//                       ...(expect_price_max
//                         ? { $lte: Number(expect_price_max) }
//                         : {}),
//                     },
//                   },
//                   { expect_price_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 $or: [
//                   {
//                     totalarea_num: {
//                       ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                       ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                     },
//                   },
//                   { totalarea_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 $or: [
//                   {
//                     floor_no_num: {
//                       ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                       ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                     },
//                   },
//                   { floor_no_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//         },
//       },
//       { $sort: sort },
//       { $skip: (parseInt(page) - 1) * parseInt(limit) },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           expect_price_num: 0,
//           totalarea_num: 0,
//           floor_no_num: 0,
//         },
//       },
//     ]);

//     // Count
//     const countResult = await Property.aggregate([
//       {
//         $addFields: {
//           expect_price_num: {
//             $convert: { input: "$expect_price", to: "double", onError: 0 },
//           },
//           totalarea_num: {
//             $convert: { input: "$totalarea", to: "double", onError: 0 },
//           },
//           floor_no_num: {
//             $convert: { input: "$floor_no", to: "double", onError: 0 },
//           },
//         },
//       },
//       {
//         $match: {
//           ...filter,
//           ...(expect_price_min || expect_price_max
//             ? {
//                 $or: [
//                   {
//                     expect_price_num: {
//                       ...(expect_price_min
//                         ? { $gte: Number(expect_price_min) }
//                         : {}),
//                       ...(expect_price_max
//                         ? { $lte: Number(expect_price_max) }
//                         : {}),
//                     },
//                   },
//                   { expect_price_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//           ...(totalareaMin || totalareaMax
//             ? {
//                 $or: [
//                   {
//                     totalarea_num: {
//                       ...(totalareaMin ? { $gte: Number(totalareaMin) } : {}),
//                       ...(totalareaMax ? { $lte: Number(totalareaMax) } : {}),
//                     },
//                   },
//                   { totalarea_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//           ...(floor_no_min || floor_no_max
//             ? {
//                 $or: [
//                   {
//                     floor_no_num: {
//                       ...(floor_no_min ? { $gte: Number(floor_no_min) } : {}),
//                       ...(floor_no_max ? { $lte: Number(floor_no_max) } : {}),
//                     },
//                   },
//                   { floor_no_num: { $exists: true } },
//                 ],
//               }
//             : {}),
//         },
//       },
//       { $count: "total" },
//     ]);

//     const totalCount = countResult.length > 0 ? countResult[0].total : 0;

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

    // === STRICT EXACT MATCH FOR SINGLE STRING VALUES ===
    if (typeof propertytype === "string" && propertytype.trim() !== "")
      filter.propertytype = propertytype.trim();

    if (typeof type === "string" && type.trim() !== "")
      filter.type = type.trim();

    if (typeof residentialtype === "string" && residentialtype.trim() !== "")
      filter.residentialtype = residentialtype.trim();

    if (typeof commercialtype === "string" && commercialtype.trim() !== "")
      filter.commercialtype = commercialtype.trim();

    if (typeof saletype === "string") filter.saletype = saletype;

    if (typeof sellertype === "string") filter.sellertype = sellertype;

    // === TEXT SEARCH (Case-insensitive) ===
    if (address) filter.address = { $regex: address.trim(), $options: "i" };
    if (landmark) filter.landmark = { $regex: landmark.trim(), $options: "i" };
    if (customerName)
      filter.customerName = { $regex: customerName.trim(), $options: "i" };

    // === OTHER FIELDS ===
    if (Dimensions) filter.Dimensions = Dimensions;
    if (city) filter.city = city;
    if (booking_tokenamount) filter.booking_tokenamount = booking_tokenamount;
    if (customerId) filter.customerId = customerId;
    if (customerNumber) filter.customerNumber = customerNumber;
    if (office_seats) filter.office_seats = Number(office_seats);
    if (acre) filter.acre = acre;
    if (kunte) filter.kunte = kunte;
    if (diet) filter.diet = diet;

    // === BOOLEAN FIELDS ===
    if (favorite !== undefined)
      filter.favorite = favorite === true || favorite === "true";

    if (reraregistered !== undefined)
      filter.reraregistered =
        reraregistered === true || reraregistered === "true";

    if (bachelor_allowed !== undefined)
      filter.bachelor_allowed =
        bachelor_allowed === true || bachelor_allowed === "true";

    if (food_provided !== undefined)
      filter.food_provided = food_provided === true || food_provided === "true";

    // === GEO LOCATION ===
    if (googleaddress?.lat && googleaddress?.long) {
      filter["googleaddress.lat"] = googleaddress.lat;
      filter["googleaddress.long"] = googleaddress.long;
    }

    // === ARRAY FIELDS WITH $in (Only if array and non-empty) ===
    if (Array.isArray(furnishing) && furnishing.length > 0)
      filter.furnishing = { $in: furnishing };

    if (Array.isArray(Facing) && Facing.length > 0)
      filter.Facing = { $in: Facing };

    if (Array.isArray(bathrooms) && bathrooms.length > 0)
      filter.bathrooms = { $in: bathrooms.map(Number) };

    if (Array.isArray(bedrooms) && bedrooms.length > 0)
      filter.bedrooms = { $in: bedrooms };

    if (Array.isArray(possessionstatus) && possessionstatus.length > 0)
      filter.possessionstatus = { $in: possessionstatus };

    if (Array.isArray(approvalauthority) && approvalauthority.length > 0)
      filter.approvalauthority = { $in: approvalauthority };

    if (Array.isArray(amenities) && amenities.length > 0)
      filter["amenities.name"] = { $all: amenities }; // All must match

    if (Array.isArray(occupancy_type) && occupancy_type.length > 0)
      filter["occupancy_type.occupayname"] = { $in: occupancy_type };

    if (Array.isArray(profession_Type) && profession_Type.length > 0)
      filter.profession_Type = { $in: profession_Type };

    // === NEARBY PLACE FILTER ===
    if (Array.isArray(nearbyplace) && nearbyplace.length > 0) {
      filter.nearbyplace = {
        $elemMatch: {
          $or: nearbyplace.map((place) => {
            const match = {};
            if (place.category) match.category = place.category;
            if (place.place_name)
              match.place_name = { $regex: place.place_name, $options: "i" };
            if (place.distance !== undefined) match.distance = place.distance;
            return match;
          }),
        },
      };
    }

    // === DATE FILTER ===
    if (dateFilter && dateFilter !== "anyTime") {
      let startDate = null;
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
        case "last3Months":
          startDate = moment().subtract(3, "months").startOf("day");
          break;
        default:
          break;
      }

      if (startDate) {
        filter.createdAt = {
          $gte: startDate.toDate(),
          $lte: now.toDate(),
        };
      }
    }

    // === SORTING ===
    let sort = { createdAt: -1 };
    if (sortBy === "priceLowToHigh") sort = { expect_price_num: 1 };
    else if (sortBy === "priceHighToLow") sort = { expect_price_num: -1 };
    else if (sortBy === "latest") sort = { createdAt: -1 };

    // === AGGREGATION PIPELINE ===
    const pipeline = [
      {
        $addFields: {
          expect_price_num: {
            $convert: { input: "$expect_price", to: "double", onError: 0 },
          },
          totalarea_num: {
            $convert: { input: "$totalarea", to: "double", onError: 0 },
          },
          floor_no_num: {
            $convert: { input: "$floor_no", to: "double", onError: 0 },
          },
        },
      },
      {
        $match: {
          $and: [
            filter,
            // Price Range
            ...(expect_price_min || expect_price_max
              ? [
                  {
                    $or: [
                      {
                        expect_price_num: {
                          ...(expect_price_min
                            ? { $gte: Number(expect_price_min) }
                            : {}),
                          ...(expect_price_max
                            ? { $lte: Number(expect_price_max) }
                            : {}),
                        },
                      },
                      { expect_price_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
            // Area Range
            ...(totalareaMin || totalareaMax
              ? [
                  {
                    $or: [
                      {
                        totalarea_num: {
                          ...(totalareaMin
                            ? { $gte: Number(totalareaMin) }
                            : {}),
                          ...(totalareaMax
                            ? { $lte: Number(totalareaMax) }
                            : {}),
                        },
                      },
                      { totalarea_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
            // Floor Range
            ...(floor_no_min || floor_no_max
              ? [
                  {
                    $or: [
                      {
                        floor_no_num: {
                          ...(floor_no_min
                            ? { $gte: Number(floor_no_min) }
                            : {}),
                          ...(floor_no_max
                            ? { $lte: Number(floor_no_max) }
                            : {}),
                        },
                      },
                      { floor_no_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
      { $sort: sort },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $project: {
          expect_price_num: 0,
          totalarea_num: 0,
          floor_no_num: 0,
        },
      },
    ];

    const properties = await Property.aggregate(pipeline);

    // === COUNT TOTAL ===
    const countPipeline = [
      {
        $addFields: {
          expect_price_num: {
            $convert: { input: "$expect_price", to: "double", onError: 0 },
          },
          totalarea_num: {
            $convert: { input: "$totalarea", to: "double", onError: 0 },
          },
          floor_no_num: {
            $convert: { input: "$floor_no", to: "double", onError: 0 },
          },
        },
      },
      {
        $match: {
          $and: [
            filter,
            ...(expect_price_min || expect_price_max
              ? [
                  {
                    $or: [
                      {
                        expect_price_num: {
                          ...(expect_price_min
                            ? { $gte: Number(expect_price_min) }
                            : {}),
                          ...(expect_price_max
                            ? { $lte: Number(expect_price_max) }
                            : {}),
                        },
                      },
                      { expect_price_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
            ...(totalareaMin || totalareaMax
              ? [
                  {
                    $or: [
                      {
                        totalarea_num: {
                          ...(totalareaMin
                            ? { $gte: Number(totalareaMin) }
                            : {}),
                          ...(totalareaMax
                            ? { $lte: Number(totalareaMax) }
                            : {}),
                        },
                      },
                      { totalarea_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
            ...(floor_no_min || floor_no_max
              ? [
                  {
                    $or: [
                      {
                        floor_no_num: {
                          ...(floor_no_min
                            ? { $gte: Number(floor_no_min) }
                            : {}),
                          ...(floor_no_max
                            ? { $lte: Number(floor_no_max) }
                            : {}),
                        },
                      },
                      { floor_no_num: { $exists: true, $ne: null } },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
      { $count: "total" },
    ];

    const countResult = await Property.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // === SEND RESPONSE ===
    res.status(200).json({
      success: true,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      properties,
    });
  } catch (error) {
    console.error("Search Properties Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching properties",
      error: error.message,
    });
  }
};
