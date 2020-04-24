/*********************
*** useful queries ***
***********************/

/** autotrace **/
set autotrace on

/** see indexes in table **/
select
   table_name,
   index_name,
   column_name,
   table_owner
from
   dba_ind_columns
WHERE table_owner = 'ESL550PROJ';


/*********************
*** Create Indexes ***
***********************/
CREATE INDEX rest_city_state
ON restaurant(city_name, state);

CREATE INDEX hotel_city_state
ON hotel(city_name, state);

CREATE INDEX rr_review_date
ON restaurant_reviews(review_date);

CREATE INDEX rp_rest_id
ON restaurant_photos (restaurant_id);

CREATE INDEX rr_rest_id
ON restaurant_reviews (restaurant_id)


/**********************
**** Queries ***********
*************************/

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
(restaurant_id, restaurant_name, stars, elite_stars, review_text, review_date, reviewer, reviewer_stars, photo_id, address, zipcode, lat, lon) 
**/

/** initial runtime: 34.815, 26.614 seconds **/
/** query time after indexing city_name, state in hotel and restaurants: 25.315. 33.39.
after indexing restaurant_photos.restaurant_id, and restaurant_reviews.restaurant_id : 0.48s
**/


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
rec_rev.reviewer_stars, x5.photo_id, r.address, r.zipcode, r.latitude, r.longitude
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
(City_name, state, num_hr_hotels, avg_hotel_rating, num_restaurants)

**/

/** 0.41 seconds. To get the hotel **/
/** initial runtime: 0.03 seconds **/


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
SELECT hr.city_name, hr.state, hr.num_hr_hotels, x3.avg_hotel_rating, x1.num_highly_restaurants, x4.avg_rest_rating
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
ON hr.city_name = x4.city_name AND hr.state = x4.state;



/** Query # 6
Returns cities where there are at least 5 hotels AND 50 restaurants

Schema: (city_name, state, num_hotels, num_restaurants)
 **/

WITH X AS (
SELECT h1.*, r1.num_restaurants
FROM 
(
SELECT h.city_name, h.state, count(*) num_hotels
FROM hotel h
group by h.city_name, h.state
HAVING count(*) > 0
ORDER BY count(*) DESC
) h1
JOIN
(
    select r.city_name, r.state, count(*) num_restaurants
    from restaurant r
    group by r.city_name, r.state) r1
ON h1.city_name = r1.city_name and r1.state = h1.state)
SELECT X.*
FROM X
WHERE X.num_restaurants > 50 AND X.num_hotels >= 5
ORDER BY X.num_hotels DESC;


/** Query #7
For restaurants in the city, find the most 20 common cuisines

Schema: (attribute, num_restaurants)
**/
SELECT * 
FROM (
    SELECT ra.attribute, count(*) num_restaurants
    FROM restaurant r
    JOIN restaurant_attributes ra
    ON r.restaurant_id = ra.restaurant_id
    WHERE r.city_name = 'New York' AND r.state = 'NY' AND r.is_restaurant = 1
    GROUP BY r.city_name, r.state, ra.attribute
    ORDER BY num_restaurants DESC
) 
WHERE ROWNUM <= 20
;


/** Query #8
Filter restaurants by cusine
Schema: (city_name, state, num_hotels, num_restaurants)
 **/

/** 0.154 seconds**/
SELECT *
FROM restaurant r
WHERE r.categories like ('%Sandwiches%')
AND r.city_name = 'New York' and r.state = 'NY';

/** 0.751 seconds **/
SELECT r.*
FROM restaurant r
JOIN restaurant_attributes ra
ON ra.restaurant_id = r.restaurant_id
WHERE ra.attribute = 'Sandwiches'
AND r.city_name = 'New York' and r.state = 'NY';

/** 0.767 seconds **/
SELECT r.*
FROM restaurant_attributes ra
JOIN restaurant r
ON ra.restaurant_id = r.restaurant_id
WHERE ra.attribute = 'Sandwiches'
AND r.city_name = 'New York' and r.state = 'NY';













/** Update Statements **/
UPDATE HOTEL
SET IMG = 'https://cache.marriott.com/marriottassets/marriott/NYCHW/nychw-hotel-entrance-9302-hor-feat.jpg?resize=375:150'
WHERE hotel_id = '3324';

UPDATE HOTEL
SET IMG = 'https://cache.marriott.com/marriottassets/marriott/NYCDS/nycds-reception-area-1152-hor-feat.jpg?resize=375:150'
WHERE hotel_id = '3325';

UPDATE HOTEL
SET IMG = 'https://cache.marriott.com/marriottassets/marriott/NYCMO/nycmo-exterior-1126-hor-feat.jpg?resize=375:150'
WHERE hotel_id = '3332';

UPDATE HOTEL
SET IMG = 'https://cache.marriott.com/marriottassets/marriott/NYCWD/nycwd-facade-7762-hor-feat.jpg?resize=375:150'
WHERE hotel_id = '3340';

UPDATE HOTEL
SET IMG = 'https://cache.marriott.com/marriottassets/marriott/NYCNU/nycnu-exterior-8939-hor-feat.jpg?resize=375:150'
WHERE hotel_id = '3341';


3324
3325
3332
3340
3341

https://cache.marriott.com/marriottassets/marriott/NYCHW/nychw-hotel-entrance-9302-hor-feat.jpg?resize=375:150

https://cache.marriott.com/marriottassets/marriott/NYCDS/nycds-reception-area-1152-hor-feat.jpg?resize=375:150

https://cache.marriott.com/marriottassets/marriott/NYCMO/nycmo-exterior-1126-hor-feat.jpg?resize=375:150

https://cache.marriott.com/marriottassets/marriott/NYCWD/nycwd-facade-7762-hor-feat.jpg?resize=375:150

https://cache.marriott.com/marriottassets/marriott/NYCNU/nycnu-exterior-8939-hor-feat.jpg?resize=375:150