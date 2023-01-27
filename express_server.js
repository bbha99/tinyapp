// Packages/Libraries
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const morgan = require("morgan");

const { generateRandomString, urlsForUser, getUserByEmail} = require("./helpers");

const app = express();
const PORT = 8080;

// Template
app.set("view engine", "ejs");

// Middleware
app.use(morgan('dev'));
// Parser for req.body
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'currentSession',
  keys: ["user_id"],
}));

// Database
const urlDatabase = {};
const users = {};

// Route Definitions
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

// Display URLs made by the logged in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.send("Error: Please log in or register first");
  }

  const userUrlDatabase = urlsForUser(urlDatabase, userId);
  const templateVars = { urls: userUrlDatabase,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

// Displays a register page for users to create an account
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  }

  const templateVars = {
    user: null
  };
  res.render("register", templateVars);
});

// Display the login page for users to access their account
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: null
  };
  res.render("login", templateVars);
});

// Allow the user to create a shortened URL of their website
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }

  const templateVars = { urls: urlDatabase,
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

// Displays the URL and short URL ID to the logged in user
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.send("Please login first");
  }

  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    return res.send("The URL does not exist");
  }

  if (urlDatabase[shortURL].userID !== userId) {
    return res.send("The URL does not belong to you");
  }

  const templateVars = { id: shortURL, longURL: urlDatabase[shortURL].longURL, user: users[userId] };
  res.render("urls_show", templateVars);
});

// Redirects the user to the long URL website
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.send(`URL with /${req.params.id} in path does not exist`);
  }

  res.redirect(longURL);
});

// Only logged in users can submit a post request to make a new short URL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.send("Must be logged in to create a new tiny URL");
  }

  const randomString = generateRandomString(6);
  const tempObject = {
    longURL: req.body.longURL,
    userID: userId
  };
  urlDatabase[randomString] = tempObject;
  res.redirect(`/urls/${randomString}`);
});

// Only users who create the short URL being accessed can post
app.post('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const newLongURL = req.body.longURL;
  const keyID = req.params.id;
  if (!urlDatabase[keyID]) {
    return res.send("ID does not exist");
  }

  if (!userId) {
    return res.send("Must be logged in to view the short URL");
  }

  if (urlDatabase[keyID].userID !== userId) {
    return res.send("The short URL does not belong to you");
  }

  urlDatabase[keyID].longURL = newLongURL;
  res.redirect('/urls');
});

// Logged in user can delete an existing URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const keyID = req.params.id;
  if (!urlDatabase[keyID]) {
    return res.send("Cannot be deleted as ID does not exist");
  }

  if (!userId) {
    return res.send("Must be logged in to delete");
  }

  if (urlDatabase[keyID].userID !== userId) {
    return res.send("Cannot be deleted, the short URL does not belong to you");
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Post request to log into user account
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (user === null) {
    return res.status(403).send("Error 403: Email cannot be found");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Error 403: Password is incorrect");
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

// Post request to log out of signed in account
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Post request to register to create an account
app.post("/register", (req, res) => {
  const id = generateRandomString(6);
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    return res.status(400).send("Error 400: Empty field provided");
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send(`"Error 400: Email is already taken"`);
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  req.session.user_id = id;
  res.redirect("/urls");

});

// Listen Handler
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});