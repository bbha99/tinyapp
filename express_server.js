const express = require("express");
var cookieParser = require('cookie-parser');
// const morgan = require("morgan");

const app = express();
const PORT = 8080; // default port 8080

// Template
app.set("view engine", "ejs");

// Middleware
// req.body parser
app.use(express.urlencoded({ extended: true }));
// req.cookie parser
app.use(cookieParser());

// app.use(morgan('dev'));

// Custom middleware
// app.use((req, res, next) => {
//   console.log("testing middleware");
//   next()
// })

// When paths not listed works
// app.get('*', (req, res) => {
//   res.redirect('/login')
// });

// Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher",
  },
};

// Functions
const getUserByEmail = email => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}

function generateRandomString(n) {
  let randomString = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for ( let i = 0; i < n; i++ ) {
    randomString += characters.charAt(Math.floor(Math.random()*characters.length));
 }
 return randomString;
};

const urlsForUser = (databaseURL, cookieID) => {
  let userLinks = {};
  for (let shortID in databaseURL) {
    if (databaseURL[shortID].userID === cookieID) {
      userLinks[shortID] = databaseURL[shortID];
    }
  }
  return userLinks;
}

// Route definitions
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if(!userId) {
    return res.send("Error: Please log in or register first")
  }
  const userUrlDatabase = urlsForUser(urlDatabase, userId);

  const templateVars = { urls: userUrlDatabase, 
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if(userId) {
    res.redirect("/urls");
  }
  const templateVars = { 
    user: null
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  if(userId) {
    return res.redirect("/urls");
  }
  const templateVars = { 
    user: null
  };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, 
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if(!longURL) {
    return res.send(`URL with /${req.params.id} in path does not exist`);
  }
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.send("Must be logged in to create a new tiny URL")
  }
  console.log(req.body); // Log the POST request body to the console
  const randomString = generateRandomString(6);
  const tempObject = {
    longURL: req.body.longURL,
    userID: userId
  }
  urlDatabase[randomString] = tempObject;
  console.log(urlDatabase)
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
  res.redirect(`/urls/${randomString}`);
});

app.post('/urls/:id', (req, res) => {
  const userId = req.cookies["user_id"];
  const newLongURL = req.body.longURL;
  const keyID = req.params.id;
  if (!urlDatabase[keyID]) {
    return res.send("ID does not exist");
  }
  if (!userId) {
    return res.send("Must be logged in to view the short URL");
  }
  if (urlDatabase[keyID].userID !== userId) {
    return res.send("The short URL does not belong to you")
  }

  urlDatabase[keyID].longURL = newLongURL;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const keyID = req.params.id;
  if (!urlDatabase[keyID]) {
    return res.send("Cannot be deleted as ID does not exist");
  }
  if (!userId) {
    return res.send("Must be logged in to delete");
  }
  if (urlDatabase[keyID].userID !== userId) {
    return res.send("Cannot be deleted, the short URL does not belong to you")
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email);
  if (user === null) {
    return res.status(403).send("Error 403: Email cannot be found");
  }
  if (user.password !== password) {
    return res.status(403).send("Error 403: Password is incorrect");
  }
  console.log("user is: ", user);
  res.cookie("user_id", user.id);
  
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const id = generateRandomString(6);
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("Error 400: Empty field provided");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send(`"Error 400: Email is already taken"`);
  }

  users[id] = {
    id,
    email,
    password
  };
  console.log("users", users);
  res.cookie("user_id", id);
  res.redirect("/urls");

});


// Listen Handler
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});