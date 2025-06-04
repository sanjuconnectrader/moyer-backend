import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();                // loads .env into process.env

const sequelize = new Sequelize(
  process.env.DB_NAME,          // railway
  process.env.DB_USER,          // root
  process.env.DB_PASSWORD,      // your long pwd
  {
    host:     process.env.DB_HOST,          // nozomi.proxy.rlwy.net
    port:     Number(process.env.DB_PORT) || 3306,  // add DB_PORT in .env
    dialect:  'mysql',
    logging:  false,            // turn SQL logs off (optional)
    dialectOptions: {
      // Railway’s MySQL instances accept TLS but don’t require it.
      // Uncomment if you turned on “require SSL” in the dashboard.
      // ssl: { rejectUnauthorized: false }
    },
  },
);

export default sequelize;
