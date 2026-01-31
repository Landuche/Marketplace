import { deleteUser } from './db-cleanup';

async function globalTeardown() {
    deleteUser('Seller');
    deleteUser('Buyer');
    console.log('Database clean.');
};

export default globalTeardown;