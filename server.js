'use strict';

var dotenv = require('dotenv');
dotenv.config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var shortid = require('shortid');
var validurl = require('valid-url');
const { doesNotMatch } = require('assert');
const { url } = require('inspector');

var app = express();
var url_count = 0;
var url_map = new Map();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
const uri = process.env.MONGO_URI;
mongoose.connect(uri,{
  useNewUrlParser:true,
  useUnifiedTopology:true,
  serverSelectionTimeoutMS: 5000 //Timeout after 5s instead of 30s
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("MongoDB database connection established successfully!");

});


app.use(cors());



//create schema
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL_MODEL = mongoose.model("URL",urlSchema);


/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

/** Get input from client - Route parameters */
app.get('/api/shorturl/:id',function(req,res,next){
URL_MODEL.findOne({short_url: req.params.id},function(err,data){
  console.log("id: " +req.params.id);
  console.log("data: " + data);

  //URL found
  if(data){
    res.redirect(data.original_url);
  }else{
    res.json({error:"short URL not found!"});
  }
  
    });
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new",function(req,res){

  const {url:_url} = req.body;
  const urlCode = shortid.generate();


    var hostname = new URL(_url).hostname;
    console.log("hostname: " + hostname);
    dns.lookup(hostname,function(err,data){
      console.log("error: " + err);
      console.log("data: " + data);
      if(err){
        console.log("hostname not found!");
        res.status(401).json({error:"invalid URL"});

      }else{
        //check whether the URL is in the Mongo DB
        URL_MODEL.findOne({original_url:_url},function(err,data){
          console.log(data);
  
          //if the record found, retrieve from Mongo DB
          if (data){
            res.json({
              original_url:data.original_url,
              short_url:data.short_url
            });
            
          }else{
  
            //create new record in Mongo DB
            //not exist, so create a new record in Mongo DB
        var new_url = new URL_MODEL({
  
          original_url: _url,
          short_url: urlCode
        });
  
        new_url.save(function(err,data){
          if(err) return console.error(err);
          console.log("original_url: " + data.original_url + "\nshort_url:" + data.short_url );
          res.json({
            original_url:data.original_url,
            short_url:data.short_url
          });
        });
        
      }

      });
    }
      
});

   
  
});

app.listen(port, function () {
  console.log('Node.js listening ... at' + port);
});