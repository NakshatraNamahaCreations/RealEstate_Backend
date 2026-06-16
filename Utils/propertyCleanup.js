const Property = require("../Model/Sellproperty/Sellproperty");
const Enquiry = require("../Model/Enquiry/Enquiry");
const Favorite = require("../Model/Sellproperty/Favorite.js");
const { cloudinary } = require("./cloudinary");

// Derive a Cloudinary public_id from a stored secure URL so the asset can be
// removed when its property is deleted.
const cloudinaryPublicIdFromUrl = (url) => {
  try {
    const match = String(url).match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
};

// Delete a property document and everything that references it (enquiries,
// favorites, Cloudinary images). Best-effort on images. Returns the counts of
// removed related docs. `property` must be a loaded Property document.
const deletePropertyAndRefs = async (property) => {
  await Property.findByIdAndDelete(property._id);

  const [enquiryResult, favoriteResult] = await Promise.all([
    Enquiry.deleteMany({ propertyId: property._id }),
    Favorite.deleteMany({ propertyId: property._id }),
  ]);

  try {
    const publicIds = (property.propertyimage || [])
      .map(cloudinaryPublicIdFromUrl)
      .filter(Boolean);
    await Promise.all(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));
  } catch (imgErr) {
    console.error("Cloudinary cleanup failed:", imgErr.message);
  }

  return {
    enquiries: enquiryResult.deletedCount,
    favorites: favoriteResult.deletedCount,
  };
};

module.exports = { deletePropertyAndRefs, cloudinaryPublicIdFromUrl };
