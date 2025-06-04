import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class VideoLink extends Model {}

VideoLink.init(
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title:     { type: DataTypes.STRING(120), allowNull: false },
    videoUrl:  { type: DataTypes.STRING, allowNull: false, validate: { isUrl: true } }
  },
  {
    sequelize,
    modelName:  'VideoLink',
    tableName:  'video_links',
    timestamps: true
  }
);

export default VideoLink;
