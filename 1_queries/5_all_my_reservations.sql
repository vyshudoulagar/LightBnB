SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, AVG(rating) AS average_rating
FROM reservations
JOIN properties ON property_id = properties.id
JOIN property_reviews ON property_reviews.reservation_id = reservations.id
WHERE reservations.guest_id = 1
GROUP BY reservations.id, properties.title, properties.cost_per_night
ORDER BY reservations.start_date
LIMIT 10;