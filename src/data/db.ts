import Database, { Database as DatabaseType } from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '..', '..', 'data', 'bot.db');
const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

export default db;
