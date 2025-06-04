import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class RestaurantPhoto extends Model {}

RestaurantPhoto.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
    imageUrl: { type: DataTypes.STRING, allowNull: false }
  },
  {
    sequelize,
    modelName: 'RestaurantPhoto',
    tableName: 'restaurant_photos',
    timestamps: true
  }
);

export default RestaurantPhoto;
