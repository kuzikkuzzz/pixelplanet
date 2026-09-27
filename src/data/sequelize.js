/**
 *
 * @flow
 */

import Sequelize from 'sequelize';

import logger from '../core/logger';
import {
  MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PW, LOG_MYSQL,
} from '../core/config';

const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PW, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  pool: {
    min: 5,
    max: 25,
    idle: 10000,
    acquire: 10000,
  },
  logging: (LOG_MYSQL) ? (...msg) => logger.info(msg) : false,
  dialectOptions: {
    connectTimeout: 10000,
    multipleStatements: true,
    ssl: {
      require: true,
      rejectUnauthorized: false, // Aiven SSL zorunluluğu için
    },
  },
});

export default sequelize;
