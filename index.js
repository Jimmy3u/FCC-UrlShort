//Imports
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

//Express Initialization
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.listen(3000, () => console.log("Server listening on port 3000"));
app.use(cors());

//Database things
const insertStatement = 'INSERT INTO shortUrls(UrlLink) VALUES (?)'
const selectStatment = 'SELECT * FROM shortUrls WHERE UrlId = ?'

let db = new sqlite3.Database(':memory:', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the in-memory SQlite database.');
    dbStart();
    });
    
const dbStart = () => {
    db.serialize(() => {

        db.run(`CREATE TABLE shortUrls (
        UrlId INTEGER PRIMARY KEY AUTOINCREMENT,
        UrlLink TEXT NOT NULL );`, (err) => (err) ? console.log(err) : console.log("Tabela criada com sucesso")),

        db.run(insertStatement, ('https://google.com'), function (err) {
            if (err) return console.log(err.message);
        })
    })
};



//Routing go here
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/?:id', (req, res) => {
    db.get(selectStatment, req.params.id, function (err, row) {
        if (err) res.send(err)

        if (row === undefined)
            res.send({ message: "URL NOT FOUND" })
        else
            res.redirect(row.UrlLink)
    })
})

app.post('/api/shorturl', (req, res) => {

    function insertThenReturnJSON(link) {
        db.run(insertStatement, [link], function () {
            res.json({
                original_url: link,
                short_url: this.lastID
            })
        })
    }

    const httpCheck = new RegExp("^(http|https)://*", "i")
    if (httpCheck.test(req.body.url)) {
        const url = new URL(req.body.url)
        dns.lookup(url.hostname, { all: true }, (err, adress, family) => {
            err ? res.json({ error: "Invalid Hostname" }) : insertThenReturnJSON(url)
        })
    } else {
        res.json({ error: "invalid url" })
    }

})
