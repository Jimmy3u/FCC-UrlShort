const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());


//Functions



//Database things
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');

    db.serialize(() => {

        db.run(`CREATE TABLE shortUrls (
        UrlId INTEGER PRIMARY KEY AUTOINCREMENT,
        UrlLink TEXT NOT NULL );`, (err) => (err) ? console.log(err) : console.log("Tabela criada com sucesso")),

            db.run('INSERT INTO shortUrls(UrlLink) VALUES ("https://google.com")', function (err) {
                if (err) return console.log(err.message);
            })
    }
    )
}
);


//Routing go here
app.get('/', (req, res) => db.get('SELECT * FROM shortUrls WHERE UrlId = ?', [2], (err, row) => {
    if (err) {
        throw err;
    }
    return res.send(row);
}))

app.get('/api/shorturl/?:id', (req, res) => {
    id = req.params.id
    db.get(`SELECT * FROM shortUrls WHERE UrlId =${id}`, function (err, row) {
        if (err) res.send(err)

        if (row === undefined)
            res.send({ message: "URL NOT FOUND" })
        else
            res.send({ shortId: row.UrlId })
    })
})

app.post('/api/shorturl', (req, res) => {

    function insertIntoDB(link) {
        db.run(`INSERT INTO shortUrls(UrlLink) VALUES ("${link}")`, function () {
            res.json({
                original_url: link,
                short_url: this.lastID
            })
        })
    }

    const url = new URL(req.body.u)
    const httpCheck = new RegExp("^(http|https)://*", "i")

    if (httpCheck.test(url))
        dns.lookup(url.hostname, { all: true }, (err, adress, family) => {
            err ? res.json({ error: "Invalid Hostname" }) : insertIntoDB(url)
        })
})
//Listen on port x
app.listen(3000, () => console.log("Server listening on port 3000"));