const Favorite = require("../../Model/Sellproperty/Favorite.js");

exports.toggleFavorite = async (req, res) => {
  try {
    const { customerId, customerName, propertyId } = req.body;

    if (!customerId || !customerName || !propertyId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const existing = await Favorite.findOne({ customerId, propertyId });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        favorited: false,
        message: "Removed from favorites",
      });
    } else {
      await Favorite.create({ customerId, customerName, propertyId });
      return res.status(201).json({
        success: true,
        favorited: true,
        message: "Added to favorites",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFavoritesWithProperty = async (req, res) => {
  try {
    const { customerId } = req.params;

    const favorites = await Favorite.aggregate([
      { $match: { customerId } },
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "propertyDetails",
        },
      },
      { $unwind: "$propertyDetails" },
      {
        $project: {
          _id: 0,
          customerId: 1,
          customerName: 1,
          property: "$propertyDetails",
        },
      },
    ]);

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
