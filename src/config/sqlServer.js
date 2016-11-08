module.exports = {
    transparencia: {
        sqlConnectionConfig: {
            user: process.env.TRANSPARENCIA_USER,
            password: process.env.TRANSPARENCIA_PASSWORD,
            server: process.env.TRANSPARENCIA_SERVER,
            database: process.env.TRANSPARENCIA_DB,
            connectionTimeout: 15000,
            requestTimeout: 30000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }
    }
};
