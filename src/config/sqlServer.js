module.exports = {
    transparencia: {
        sqlConnectionConfig: {
            user: process.env.DETRANNET_USER,
            password: process.env.DETRANNET_PASSWORD,
            server: process.env.DETRANNET_SERVER,
            database: process.env.DETRANNET_DB,
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
