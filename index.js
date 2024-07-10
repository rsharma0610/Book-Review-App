import express from "express";
import pg from "pg";
import bodyParser from "body-parser";

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book",
    password: "36Postgres172!",
    port: 5432,
  });
db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 0;
//Validates whther or not the credentials entered match an existing user and sets the currentUserId variable if valid
async function validUser(username, password){
    const query = await db.query("SELECT id, username, password FROM users WHERE username=$1 AND password=$2", [username, password]);
    if(query.rows.length !== 0){
        currentUserId = query.rows[0].id;
        return true;
    }
    return false;
}
//Fetches all the book reviews for a specific user
async function getReviews(id){
    const query = await db.query(
        "SELECT books.title, books.review, books.rating, books.date, users.name FROM books JOIN users ON books.userId = users.id WHERE users.id = $1;",
        [id]);
    return query.rows;
}

console.log("User id before the login", currentUserId);
//Gets the login view
app.get("/", async (req, res) => {
    res.render("login.ejs");
});
//Gets the registration view
app.get("/registration", (req, res) => {
    res.render("register.ejs");
});
//Gets the create note view
app.get("/create", (req, res) => {
    res.render("create.ejs");
});
//Gets the reviews when the user uses the navigation tools
app.get("/reviews", async (req, res) => {
    var reviews = await getReviews(currentUserId);
    res.render("index.ejs", {reviews: reviews});
});
//Handles signout requests
app.get("/signout", (req, res) => {
    currentUserId = 0;
    res.redirect("/");
})
//Handles login requests
app.post("/login", async (req, res) => {
    const userExists = await validUser(req.body.username, req.body.password);
    if(userExists){
        console.log("User id after the login", currentUserId);
        var reviews = await getReviews(currentUserId);
        res.render("index.ejs", {reviews: reviews});
    }else{
        res.render("login.ejs", {error: "Invalid Credentials, Try Again or Register an Account"});
    }
});
//Handles registration requests
app.post("/register", async (req, res) => {
    const userExists = await validUser(req.body.username, req.body.password);
    if(userExists){
        res.render("login.ejs", {error: "User already exists"});
    }else{
        try{
            await db.query("INSERT INTO users (name, username, password) VALUES ($1, $2, $3)", [req.body.name, req.body.username, req.body.password]);
        }catch(error){}
        res.render("login.ejs", {error: "User registered"});
    }
    
});
//Handles book review creation
app.post("/publish", async(req, res) => {
    try{
        await db.query("INSERT INTO books (userId, title, author, review, rating) VALUES ($1, $2, $3, $4, $5);",
        [currentUserId, req.body.title, req.body.author, req.body.review, req.body.rating]);
    }catch(error){}
    var reviews = await getReviews(currentUserId);
    res.render("index.ejs", {reviews: reviews});
})
//Sorts the reviews, make sure to update the sort type displayed in the index.ejs file
app.post("/sort", async (req, res) => {
    const sort = req.body.sortType;
    const query = await db.query(
        `SELECT books.title, books.review, books.rating, books.date, users.name FROM books JOIN users ON books.userId = users.id WHERE users.id = $1 ORDER BY books.${sort} DESC;`,
        [currentUserId]);
    res.render("index.ejs", {reviews: query.rows});
});
//Determines what port the app is launched
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });