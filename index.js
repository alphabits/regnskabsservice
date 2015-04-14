var express = require("express");
var handlebars = require("express-handlebars").create({ defaultLayout: "main" })
var request = require("request")

var app = express();

app.engine("handlebars", handlebars.engine);

app.set("view engine", "handlebars");


app.set("port", process.env.PORT || 3000);


app.get("/", function (req, res) {
    res.render("home")
})

app.get("/search", function (req, res) {
    var search = req.query.q;
    var searchPattern = /^[0-9]{8}$/;
    if (search && search.match(searchPattern)) {
        var url = "http://distribution.virk.dk/offentliggoerelser/_search?q=cvrNummer:"+req.query.q
        request(url, function (err, cvrRes, body) {
            console.log("GOT respon", body)
            var responseObject = JSON.parse(body);
            var hits = transformCvrResponse(responseObject);
            res.render("search", {hits: hits, q: search, success: true})
        })
    } else {
        res.render("search", {hits: [], q: search, success: false})
    }
})

app.use(function (req, res, next) {
    res.status(404)
    res.render("404")
})


app.listen(app.get("port"), function () {
    console.log("Started listening on port " + app.get("port"))
})


var transformCvrResponse = function (response) {
    var hits = response["hits"]["hits"];
    return {
        numHits: hits.length,
        hits: hits.map(transformHit)
    };
}


var transformHit = function (hit) {
    var source = hit["_source"];
    var period = source.regnskab.regnskabsperiode;
    return {
        cvr: source.cvrNummer,
        startDate: period.startDato,
        endDate: period.slutDato,
        link: getPdfLinkFromDocs(source.dokumenter)
    };
}

var getPdfLinkFromDocs = function (documents) {
    var link = "";
    documents.forEach(function (doc) {
        if (doc.dokumentMimeType == "application/pdf") {
            link = doc.dokumentUrl
        }
    })
    return link;
}
