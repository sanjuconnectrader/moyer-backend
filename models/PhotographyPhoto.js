import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class PhotographyPhoto extends Model {}

PhotographyPhoto.init(
  {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    imageUrl:   { type: DataTypes.STRING,  allowNull: false }
  },
  {
    sequelize,
    modelName:  'PhotographyPhoto',
    tableName:  'photography_photos',
    timestamps: true
  }
);

export default PhotographyPhoto;
