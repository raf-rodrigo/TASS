import Dexie from 'dexie';

export const db = new Dexie('BreatheDB');

db.version(1).stores({
  settings: 'key'
});
