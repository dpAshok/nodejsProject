const express = require("express");
const app = express();
const port = 4010;
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbpath = path.join(__dirname, "database.db");

let db = null;

const initailizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`server is running on ${port}`);
    });
  } catch (e) {
    console.log(`Db error : ${e.message}`);
  }
};

initailizeDbAndServer();

app.get("/", async (request, response) => {
  const { username, password } = request.body;
  const getQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.all(getQuery);
  response.send(dbUser);
});
