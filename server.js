var express = require("express");
var request = require("request");
var app = express();
var passwordhash = require("password-hash");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static('views'));

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.get("/signup", function (req, res) {
    res.sendFile(__dirname + "/public/" + "signup.html" );
});

app.get("/login", function (req, res) {
    res.sendFile(__dirname + "/public/" + "login.html" );
});

app.get("/dashboard", function (req, res) {
    res.sendFile(__dirname + "/public/" + "dashboard.html" );
});

app.post("/loginSubmit", function (req, res) {
    const Fullname = req.body.username;

    db.collection("signup details")
    .where("Fullname", "==", Fullname)
    .get()
    .then((docs) => {
        var verified = false;
        docs.forEach((doc) => {
            const hashedPassword = doc.data().Password; // Assuming the field is "Password"
            if (passwordhash.verify(req.body.password, hashedPassword)) {
                verified = true;
            }
        });

        if (verified) {
            res.send("<div class='center-message'>Logged in successfully. Click here to view <a href='/dashboard'>dashboard</a>.</div>");
        } else {
            res.send("Login failed");
        }
    });
});

app.post("/signupSubmit", function (req, res) {
    db.collection("signup details")
    .where("Fullname","==",req.body.fullname)
    .get()
    .then((docs) => {
        if (docs.size > 0) {
            res.send("<div class='center-message'>Account already registered. Click here to view <a href='/login'>LOG-IN</a>.</div>");
        } else {
            const hashedPassword = passwordhash.generate(req.body.password);
            db.collection("signup details").add({
                Fullname: req.body.fullname,
                Email: req.body.Email,
                Password: hashedPassword
            }).then(() => {
                res.send("Signed up successfully, you can now log in <a href='/login'>here</a>.");
            });
        }
    });
});

app.get("/dashboardSubmit", function (req, res) {
    const movieName = req.query.movieName;

    const apiKey = '94341948';
    const url = `https://www.omdbapi.com/?t=${movieName}&apikey=${apiKey}`;

    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            try {
                const movieData = JSON.parse(body);
                if (movieData.Response === 'True') {
                    const movieTitle = movieData.Title;
                    const Genre = movieData.Genre;
                    const Released = movieData.Released;
                    const movieRatings = movieData.Ratings[0].value; 
                    const moviePlot = movieData.Plot;
                    const Director = movieData.Director;
                    const Actors = movieData.Actors;
                    const Awards = movieData.Awards;
                    
                    const htmlResponse = `
                    <html>
                    <head>
                    <title >Movie Details</title>
                    <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 30vh;
                        margin: 10;
                        
                    }
                    .content {
                    background-color: white;
                    text-align: center;
                    border: 5px solid #ccc; 
                    padding: 20px; 
                    border-color: #2ac0e6;
                    border-radius: 5%;
          
                    }
                    </style>
                    </head>
                    <body>
                    <div class="content">
                    <h1><u>MOVIE DETAILS</u>:-</h1>
                    <p><b>Movie Name:</b> ${movieTitle}</p>
                    <p><b>Genre:</b> ${Genre}</p>
                    <p><b>Release Date:</b> ${Released}</p>
                    <p><b>Director:</b> ${Director}</p>
                    <img src="${movieData.Poster}" alt="${movieData.Title} Poster ">
                    <p><b>Actors:</b> ${Actors}</p>
                    <p><b>Awards:</b> ${Awards}</p>
                    <p><b>Movie Ratings:</b> ${movieRatings}</p>
                    <p>click <a href="https://ww4.5movierulz.pw/">here</a> to download movie.</p>
                    </div>
                    </body>
                    </html>`;
      
  
                    res.send(htmlResponse);
                } else {
                    res.status(404).json({ error: "Movie not found" });
                }
            } catch (error) {
                console.error('Error parsing movie data:', error);
                res.status(500).json({ error: "An error occurred while fetching movie details" });
            }
        } else {
            console.error('Error fetching movie details:', error);
            res.status(500).json({ error: "An error occurred while fetching movie details" });
        }
    });
});

app.listen(3000);
console.log("Listening to the server on port 3000.");
