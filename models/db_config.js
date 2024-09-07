// models/db_config.js
const Database = require('better-sqlite3');
const db = new Database('data/project.db');

module.exports = db;
