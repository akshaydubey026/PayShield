const { Client } = require('pg');

const passwords = ['mysecret123', 'postgres', 'root', 'password', '1234', '123456', 'Anmol23', 'admin', ''];

async function testConnection() {
    for (let pw of passwords) {
        const client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: pw,
            database: 'postgres'
        });
        
        try {
            await client.connect();
            console.log(`SUCCESS: Connected with password: "${pw}"`);
            await client.end();
            return;
        } catch (e) {
            console.log(`FAILED with password: "${pw}"`);
        }
    }
    console.log("All common passwords failed.");
}

testConnection();
