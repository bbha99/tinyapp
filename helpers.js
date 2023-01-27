// Functions
// Generates a alpha-numeric string of size n
function generateRandomString(n) {
  let randomString = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for ( let i = 0; i < n; i++ ) {
    randomString += characters.charAt(Math.floor(Math.random()*characters.length));
 }
 return randomString;
};

// Returns the user details associated with a cookie ID if it exist
const urlsForUser = (databaseURL, cookieID) => {
  let userLinks = {};
  for (let shortID in databaseURL) {
    if (databaseURL[shortID].userID === cookieID) {
      userLinks[shortID] = databaseURL[shortID];
    }
  }
  return userLinks;
}

// Returns the user object associated with an email
const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
}

module.exports = {
  generateRandomString,
  urlsForUser,
  getUserByEmail
}