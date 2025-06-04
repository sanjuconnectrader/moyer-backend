import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';
import RestaurantPhoto from './RestaurantPhoto.js';

class Restaurant extends Model {}

Restaurant.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { len: [2, 100] }
    },

    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },

    coverImage: {
      type: DataTypes.STRING,        // /uploads/restaurants/file.jpg
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    timestamps: true
  }
);

/* One-to-many: Restaurant → RestaurantPhoto */
Restaurant.hasMany(RestaurantPhoto, {
  foreignKey: 'restaurantId',
  as: 'photos',
  onDelete: 'CASCADE'
});
RestaurantPhoto.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

export default Restaurant;
