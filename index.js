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

async function validUser(username, password){
    const query = await db.query("SELECT username, password FROM users WHERE username=$1 AND password=$2", [username, password]);
    //console.log(query.rows);
    if(query.rows.length !== 0){
        //console.log("Proceed into website");
        return true;
    }
    //console.log("User does not exist");
    return false;
}
async function getUserId(username, password){
    const query = await db.query("SELECT id FROM users WHERE username=$1 AND password=$2", [username, password]);
    return query.rows[0].id;
}
async function getReviews(username, password){
    const query = await db.query(
        "SELECT books.title, books.review, books.rating, books.date, users.name FROM books JOIN users ON books.userId = users.id WHERE users.username = $1 AND users.password = $2;",
        [username, password]);
    return query.rows;
}

let currentUserId = 0;
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
//Handles login requests
app.post("/login", async (req, res) => {
    const userExists = await validUser(req.body.username, req.body.password);
    if(userExists){
        currentUserId = await getUserId(req.body.username, req.body.password);
        console.log("User id after the login", currentUserId);
        var reviews = await getReviews(req.body.username, req.body.password);
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
    res.redirect("/create");
})
//Determines what port the app is launched
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });