/**
Query 4 updated.
Show recommended restaurants:
Show 3 restaurants in {city, state} with the 
highest overall rating (sum of : rating + average Yelp Elite rating)

Returns: 
- restaurant id
- restaurant name
- avg number of stars
- avg yelp_elite rating
- most recent Elite review
- review date
- reviewer name
- stars that reviewer gave to the restaurant

Result schema: 
(restaurant_id, restaurant_name, stars, elite_stars, review_text, review_date, reviewer, reviewer_stars, photo_id) 
**/

/** initial runtime: 34.815 seconds **/

/** find the avg yelp elite rating **/
WITH t AS (
    SELECT r.restaurant_id, avg(r.stars) elite_stars
    FROM restaurant r
    JOIN restaurant_reviews rr ON R.restaurant_id = rr.restaurant_id
    JOIN yelp_reviewers y ON rr.reviewer_id = y.user_id
    WHERE r.is_restaurant = 1 AND y.is_elite = 1
    AND r.city_name = 'New York' and r.state = 'NY'
    GROUP by r.restaurant_id
),
/** Get latest yelp elite review **/
rec_rev AS (
    SELECT rr.restaurant_id, rr.review_text, rr.stars reviewer_stars, rr.review_date, y.name
    FROM restaurant_reviews rr
    INNER JOIN (
            SELECT rr.restaurant_id, MAX(rr.review_date) review_date
            FROM restaurant_reviews rr 
            JOIN yelp_reviewers y on rr.reviewer_id = y.user_id
            WHERE y.is_elite = 1
            GROUP BY rr.restaurant_id
        ) x 
    ON rr.restaurant_id = x.restaurant_id AND rr.review_date = x.review_date
    JOIN yelp_reviewers y on rr.reviewer_id = y.user_id
)
/** get overall rating , limit to 3 restaurants **/
SELECT t.restaurant_id, r.restaurant_name, 
r.stars, t.elite_stars, rec_rev.review_text, 
rec_rev.review_date, rec_rev.name reviewer, 
rec_rev.reviewer_stars, x5.photo_id
FROM t
JOIN rec_rev on t.restaurant_id = rec_rev.restaurant_id
JOIN restaurant r ON t.restaurant_id = r.restaurant_id
/** Get photo for restaurant **/
LEFT JOIN (
    SELECT rp.restaurant_id, MAX(rp.photo_id) photo_id
    FROM restaurant_photos rp
    GROUP BY rp.restaurant_id
) x5
ON x5.restaurant_id = t.restaurant_id
/* Set city name and State*/
WHERE r.city_name = 'New York' and r.state = 'NY'
AND r.is_restaurant = 1
AND rownum < 4
ORDER BY (r.stars + t.elite_stars) DESC
;


/**
Query 5 updated - show recommended cities
Show {3} cities with the most number of highly rated hotels (4 stars +)

For each of these 3 cities, show:
- the most highly rated hotel (with picture)
- the total number of 4 star restaurants

Returns:
- City, State
- Average Hotel Rating, Number of highly rated hotels
- Avg Restaurant Rating, Num highly rated restaurants


Result schema: 
(City_name, state, num_hr_hotels, avg_hotel_rating, num_restaurants, hotel_name, category, num_reviews, rating, img)

**/

/** initial runtime: 0.362 seconds **/


/** Get top 3 highly rated cities **/
WITH highlyRated AS (
SELECT city_name, state, num_hr_hotels
FROM (
    SELECT city_name, state, count(*) as num_hr_hotels
    FROM hotel
    WHERE rating >= 4
    GROUP by city_name, state
    ORDER BY num_hr_hotels DESC)
    WHERE ROWNUM <= 3)

SELECT hr.city_name, hr.state, hr.num_hr_hotels, x3.avg_hotel_rating, x1.num_highly_restaurants, x4.avg_rest_rating, x2.hotel_name, x2.category, x2.num_reviews, x2.rating, x2.img
FROM highlyRated hr
JOIN
/** Get avg hotel rating for the city **/
(SELECT city_name, state, avg(rating) avg_hotel_rating
FROM hotel 
GROUP BY city_name, state) x3
ON hr.city_name = x3.city_name AND hr.state = x3.state
/** Get num of highly rated restaurants **/
JOIN
(
    SELECT r.city_name, r.state, count(*) num_highly_restaurants
    FROM restaurant r
    WHERE r.stars >= 4
    GROUP BY r.city_name, r.state
) x1
ON hr.city_name = x1.city_name AND 
hr.state = x1.state
/** Find avg restaurant rating for the city **/
JOIN (
    SELECT city_name, state, avg(stars) avg_rest_rating
    FROM restaurant r
    GROUP BY r.city_name, r.state
) x4
ON hr.city_name = x4.city_name AND hr.state = x4.state
/** find top rated hotel (or hotels if there's a tie) in each city**/
JOIN 
(SELECT h5.*
FROM hotel h5
INNER JOIN (
SELECT h3.city_name, h3.state, max(h3.hotel_id) hotel_id
FROM (
SELECT h1.*
FROM hotel h1
/** find max rating **/
INNER JOIN (
    SELECT h.city_name, h.state, max(h.rating) max_rating
    FROM hotel h
    GROUP BY h.city_name, h.state
) i2 on h1.city_name = i2.city_name AND i2.state = h1.state AND h1.rating = i2.max_rating
) h3
GROUP BY h3.city_name, h3.state) h4 
on h5.hotel_id = h4.hotel_id
) x2 
ON hr.city_name = x2.city_name AND hr.state = x2.state;



