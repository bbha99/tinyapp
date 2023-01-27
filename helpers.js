const getUserByEmail = (email, database) => {
  for (let user in database) {
    // console.log(database[user], database[user].email)
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
}

module.exports = {
  getUserByEmail
}