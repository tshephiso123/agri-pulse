import { createBackend } from './index.mjs';
if (process.env.NODE_ENV === 'production') throw new Error('Use npm start behind HTTPS in production.');
const backend = createBackend({ databasePath: process.env.DATABASE_PATH, publicOrigin: 'http://localhost:5173' });
backend.server.listen(4173, '127.0.0.1', () => console.log('Development API ready; open http://localhost:5173'));
