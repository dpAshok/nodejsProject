const express = require("express");
require("dotenv").config();
const app = express();

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "database.db");
const port = process.env.PORT || 4000;

app.use(express.json());
let db = null;

initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`server is running on ${port}`);
    });
  } catch (e) {
    console.log(`Db error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const authenticateToken = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  let jwtToken;
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
    if (jwtToken !== undefined) {
      jwt.verify(jwtToken, "secretKey", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid Access Token");
        } else {
          request.username = payload.username;
          next();
        }
      });
    } else {
      response.status(401);
      response.send("Invalid Access Token");
    }
  }
};

app.post("/users/", async (request, response) => {
  const { username, password, email } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserDetails = `SELECT * FROM users WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetails);
  if (dbUser === undefined) {
    // create user in users table
    const createUserQuery = `
        INSERT INTO users(username,password,email)
        values (
            '${username}','${hashedPassword}','${email}' 
        );
    `;
    await db.run(createUserQuery);
    response.send("User Created successfully");
  } else {
    //send invalid username as response
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `SELECT * FROM users where username = '${username}'`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      //check password and hashedPassword
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "secretKey");
      response.send({ jwtToken });
    } else if (username !== dbUser.username) {
      response.status(400);
      response.send("Invalid Username");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.get("/books/", authenticateToken, async (request, response) => {
  response.send("book Details");
});

app.get("/books/:bookId", authenticateToken, async (request, response) => {
  const { bookId } = request.params;
  const { username } = request;
  const getUserDetails = `SELECT * FROM users where username = '${username}'`;
  const dbUser = await db.get(getUserDetails);
  response.send(dbUser);
});
