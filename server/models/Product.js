const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    images: [{ type: String, required: true }],
    ratings: [ratingSchema]
  },
  { timestamps: true }
);

productSchema.virtual('averageRating').get(function averageRating() {
  if (!this.ratings.length) return 0;
  const total = this.ratings.reduce((sum, item) => sum + item.rating, 0);
  return Number((total / this.ratings.length).toFixed(1));
});

productSchema.index({ name: 'text', description: 'text', category: 'text' });

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
