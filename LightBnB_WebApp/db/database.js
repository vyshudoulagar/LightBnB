const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require("pg");
const pool = new Pool({
    database: "lightbnb"
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
    return pool
        .query(`SELECT * FROM users WHERE email = $1`, [email])
        .then((res) => {
            const user = res.rows[0];
            if (user) {
                return user;
            }
            return null;
        })
        .catch((err) => {
            console.error(err.message);
        });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
    return pool
        .query(`SELECT * FROM users WHERE id = $1`, [id])
        .then((res) => {
            const user = res.rows[0];
            if (user) {
                return user;
            }
            return null;
        })
        .catch((err) => {
            console.log(err.message);
        });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
    return pool
        .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`, [user.name, user.email, user.password])
        .then((res) => {
            return res.rows[0];
        })
        .catch((err) => {
            console.log(err.message);
        });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
    return pool
        .query(`SELECT reservations.*, properties.title, properties.cost_per_night, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON property_id = properties.id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.title, properties.cost_per_night
    ORDER BY reservations.start_date
    LIMIT $2`, [guest_id, limit])
        .then((res) => {
            return res.rows;
        })
        .catch((err) => {
            console.error(err.message);
        });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
    const queryParams = [];

    let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    WHERE 1 = 1
    `;

    if (options.city) {
        queryParams.push(`%${options.city}%`);
        queryString += `AND city LIKE $${queryParams.length} \n`;
    }

    if (options.owner_id) {
        queryParams.push(options.owner_id);
        queryString += `AND owner_id = $${queryParams.length} \n`;
    }

    if (options.minimum_price_per_night && options.maximum_price_per_night) {
        queryParams.push(options.minimum_price_per_night * 100);
        queryString += `AND cost_per_night >= $${queryParams.length} \n`;
        queryParams.push(options.maximum_price_per_night * 100);
        queryString += `AND cost_per_night <= $${queryParams.length} \n`;
    }

    queryString += `GROUP BY properties.id \n`

    if (options.minimum_rating) {
        queryParams.push(options.minimum_rating);
        queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} \n`;
    }

    queryParams.push(limit);
    queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

    console.log(queryString, queryParams);

    return pool
        .query(queryString, queryParams)
        .then((res) => {
            return res.rows;
        })
        .catch((err) => {
            console.log(err.message);
        });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
    return pool
        .query(`INSERT INTO properties 
        (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`, 
        [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
        .then((res) => {
            return res.rows[0];
        })
        .catch((err) => {
            console.log(err.message);
        });
};

module.exports = {
    getUserWithEmail,
    getUserWithId,
    addUser,
    getAllReservations,
    getAllProperties,
    addProperty,
};
