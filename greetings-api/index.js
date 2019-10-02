var express = require("express");
var routes = require('./routes');

var app = express();

app.use('/api/greetings', routes);

app.listen(5000, (err)=>{
    if(err){
        console.log("Error", err);
    }
    console.log("Server started ");
});


