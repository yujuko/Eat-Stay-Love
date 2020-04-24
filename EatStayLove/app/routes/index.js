var express = require('express');
var router = express.Router();
var path = require('path');
// var mysql = require('mysql');
const oracledb = require('oracledb');

/* Connect to Database */
var connection;
async function run(){
  try{
      connection = await oracledb.getConnection({
      user     : 'ESL550Proj',
      password : 'Indictment1!',
      connectString : 'cis550proj.crcraxcadczo.us-east-1.rds.amazonaws.com/ESL'
      })
      console.log("SUCCESS! Database is connected ... ");
      var result = await connection.execute(
        `SELECT * FROM City`)
      // console.log(result.rows)
    }catch(err){
      console.log("Error connecting database ... ");
      console.error(err)
    }finally{
      if(connection){
        try{}
        catch(err){
          console.log("Error connecting database ... ");
          console.error(err)
        }
      }
    }
}
run();

router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
});
router.get('/restaurants', function(req, res) {
  res.sendFile(path.join(__dirname, '../', 'views', 'restaurants.html'));
});
router.get('/hotels', function(req, res) {
  res.sendFile(path.join(__dirname, '../', 'views', 'hotels.html'));
});
router.get('/summary', function(req, res) {
  res.sendFile(path.join(__dirname, '../', 'views', 'summary.html'));
});


/* ---------- Cities ---------- */
router.get('/city', function(req, res) {
  var query = `
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
				WHERE X.num_restaurants > 500 AND X.num_hotels >= 5
				ORDER BY X.num_hotels DESC
  			`;

  connection.execute(query, function(err, rows, fields) {
    if (err) console.log("connection error" + err);
    else {
      // console.log(rows);
      res.json(rows);
    }
  });
});


/* ---------- Top Cities ---------- */
router.get('/topCities', function(req, res) {
  var query = `
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

				(SELECT city_name, state, avg(rating) avg_hotel_rating
				FROM hotel
				GROUP BY city_name, state) x3
				ON hr.city_name = x3.city_name AND hr.state = x3.state

				JOIN
				(
				    SELECT r.city_name, r.state, count(*) num_highly_restaurants
				    FROM restaurant r
				    WHERE r.stars >= 4
				    GROUP BY r.city_name, r.state
				) x1
				ON hr.city_name = x1.city_name AND
				hr.state = x1.state

				JOIN (
				    SELECT city_name, state, avg(stars) avg_rest_rating
				    FROM restaurant r
				    GROUP BY r.city_name, r.state
				) x4
				ON hr.city_name = x4.city_name AND hr.state = x4.state

				JOIN
				(SELECT h5.*
				FROM hotel h5
				INNER JOIN (
				SELECT h3.city_name, h3.state, max(h3.hotel_id) hotel_id
				FROM (
				SELECT h1.*
				FROM hotel h1

				INNER JOIN (
				    SELECT h.city_name, h.state, max(h.rating) max_rating
				    FROM hotel h
				    GROUP BY h.city_name, h.state
				) i2 on h1.city_name = i2.city_name AND i2.state = h1.state AND h1.rating = i2.max_rating
				) h3
				GROUP BY h3.city_name, h3.state) h4
				on h5.hotel_id = h4.hotel_id
				) x2
				ON hr.city_name = x2.city_name AND hr.state = x2.state
				ORDER BY hr.num_hr_hotels DESC
  			  `;

  connection.execute(query, function(err, rows, fields) {
    if (err) console.log("connection error" + err);
    else {
      console.log(rows);
      res.json(rows);
    }
  });
});



/* ---------- Top 5 Star Rated Restaurants with Most Yelp Elites ---------- */
router.get('/fiveStarsRestaurants', function(req, res) {
  var query = `
SELECT r.restaurant_name, r.city_name, r.stars, rp.photo_id, x2.numEliteReviews FROM 
(
SELECT r.restaurant_id, count(r.restaurant_id) as numEliteReviews
FROM restaurant r
INNER JOIN (
    SELECT r.restaurant_id
    FROM restaurant r
    WHERE r.stars = 5 and r.is_restaurant = 1
) x on r.restaurant_id = x.restaurant_id
JOIN restaurant_reviews rr ON r.restaurant_id = rr.restaurant_id
JOIN yelp_reviewers yr on rr.reviewer_id = yr.user_id
WHERE rr.stars = 5 AND yr.is_elite = 1
GROUP BY r.restaurant_id
ORDER BY numEliteReviews DESC) x2 JOIN restaurant r on x2.restaurant_id = r.restaurant_id
JOIN restaurant_photos rp on x2.restaurant_id = rp.restaurant_id
WHERE ROWNUM <= 1`

  connection.execute(query, function(err, rows, fields) {
    if (err) console.log("connection error" + err);
    else {
      console.log(rows);
      res.json(rows);
    }
  });
});

/* ---------- Hotels (Marriott) ---------- */
router.get('/hotel/:state/:rating/:category', function(req, res) {
		var state = req.params.state;
		var rating = req.params.rating;
		var category = req.params.category;
		var query = ` 	SELECT hotel_name,
						city_name,
						latitude,
						longitude,
						rating,
						category,
						img,
						address,
						zipcode
						FROM (SELECT *
							  FROM hotel
							  WHERE state = '${state}' AND rating >= '${rating}' AND category >= '${category}'
							  ORDER BY rating DESC, category DESC)
						WHERE ROWNUM<= 100`;

  connection.execute(query, function(err, rows, fields) {
    if (err) console.log("connection error" + err);
    else {
    	console.log(query);
      console.log(rows);
      res.json(rows);
    }
  });
});


/* ---------- Cuisine  ---------- */
router.get('/cuisine/:city/:state', function(req, res) {
  var city = req.params.city;
  var state = req.params.state;
  var query = `SELECT *
	FROM (
    SELECT ra.attribute, count(r.restaurant_id) num_restaurants
    FROM restaurant r
    JOIN restaurant_attributes ra
    ON r.restaurant_id = ra.restaurant_id
    WHERE r.city_name = '${city}' AND r.state = '${state}' AND r.is_restaurant = 1
    GROUP BY r.city_name, r.state, ra.attribute
    ORDER BY num_restaurants DESC
)
WHERE ROWNUM <= 20

			`;

  connection.execute(query, function(err, rows, fields) {
    if (err) console.log("connection error" + err);
    else {
      console.log(rows);
      res.json(rows);
    }
  });
});


/* ---------- Restaurants - All (Yelp) ---------- */
router.get('/restaurant/:state/:rating/:cuisine', function(req, res) {
	var state = req.params.state;
	var rating = req.params.rating;
  	var cuisine = req.params.cuisine;

  	if (cuisine == 'No Preference'){
  		cuisine = '';
  	}

	var query = ` 	SELECT R1.restaurant_id,
					R1.restaurant_name,
					R1.stars,
					R1.review_count,
					R1.latitude,
					R1.longitude,
					R1.address,
					R1.categories,
					R2.photo_id
					FROM (SELECT *
					FROM Restaurant
					WHERE is_restaurant = 1 AND categories like ('%${cuisine}%') AND stars >= '${rating}' AND review_count > 10 AND state = '${state}'
					ORDER BY stars DESC) R1,
					Restaurant_photos R2
					WHERE R1.restaurant_id = R2.restaurant_id
				`;

	connection.execute(query, function(err, rows, fields) {
		if (err) console.log("connection error" + err);
		else {
			console.log(rows);
			res.json(rows);
		}
	});
});

/* ---------- Restaurants - Top in City (Yelp) ---------- */
router.get('/topRestaurants/:city/:state', function(req, res) {
	var city = req.params.city;
	var state = req.params.state;
	var query = `
				WITH t AS (
				    SELECT r.restaurant_id, avg(r.stars) elite_stars
				    FROM restaurant r
				    JOIN restaurant_reviews rr ON R.restaurant_id = rr.restaurant_id
				    JOIN yelp_reviewers y ON rr.reviewer_id = y.user_id
				    WHERE r.is_restaurant = 1 AND y.is_elite = 1
				    AND r.city_name = '${city}' and r.state = '${state}'
				    GROUP by r.restaurant_id
				),

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

				SELECT t.restaurant_id, r.restaurant_name,
				r.stars, t.elite_stars, rec_rev.review_text,
				rec_rev.review_date, rec_rev.name reviewer,
				rec_rev.reviewer_stars, x5.photo_id, r.address, r.zipcode, r.latitude, r.longitude
				FROM t
				JOIN rec_rev on t.restaurant_id = rec_rev.restaurant_id
				JOIN restaurant r ON t.restaurant_id = r.restaurant_id

				INNER JOIN (
				    SELECT rp.restaurant_id, MAX(rp.photo_id) photo_id
				    FROM restaurant_photos rp
				    WHERE rp.photo_id is not null
				    GROUP BY rp.restaurant_id
				) x5
				ON x5.restaurant_id = t.restaurant_id

				WHERE r.city_name = '${city}' and r.state = '${state}'
				AND r.is_restaurant = 1
				AND rownum < 6
				ORDER BY (r.stars + t.elite_stars) DESC
				`;
	// console.log(query);
	connection.execute(query, function(err, rows, fields) {
		if (err) console.log("connection error" + err);
		else {
			console.log(rows);
			res.json(rows);
		}
	});
});


module.exports = router;
