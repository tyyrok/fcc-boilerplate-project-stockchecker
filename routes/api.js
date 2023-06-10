'use strict';

const mongoose = require('mongoose');
const https = require('node:https');
const { resolve } = require('node:path');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let stockSchema = new mongoose.Schema({
  stock: String,
  ip: String,
  likes: {
    type: Number,
    default: 0
  },
});

let StockInstance = new mongoose.model('StockInstance', stockSchema);



module.exports = function (app) {

  app.route('/api/stock-prices/')
    .get(function (req, res){

      makeRequest(req, res);
    
    })
    
};
//Function to make request incl multiple
let makeRequest = function(req, res) {

  console.log(req.query);

  if (Array.isArray(req.query.stock)) {
    
    let promiseArray = [];

    for (let i = 0; i < req.query.stock.length; i++) {
      let reqUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'+ req.query.stock[i] +'/quote';  
      promiseArray.push(callApi(reqUrl));
    }

    Promise.all(promiseArray)
           .then((value) => sendResponse(value, req, res))

  } else {

    let reqUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'+ req.query.stock +'/quote';
    let promise = callApi(reqUrl);

    promise.then((value) => sendResponse(value, req, res));
  }

};

//Make request through API
function callApi(reqUrl) {
  return new Promise(function(resolve, reject) {

    https.get(reqUrl, (res) => {
      var json = '';
      console.log('statusCode: ', res.statusCode);

      res.on('data', (d) => {
        json += d;
      });
      res.on('end', function() {
        if (res.statusCode === 200){
          try {
            let stockData = JSON.parse(json);
            let symbol = stockData.symbol;
            let price = stockData.latestPrice;
            let result = {};
            result[symbol] = price;
            resolve(result);
          } catch (e) {
            console.log("Error parsing JSON!");
          }
        } else {
          console.log("status!")
        }
      });
    }).on('error', (e) => {
      console.log(e);
    });

  });
}

//Function to show results
let sendResponse = function(object, req, res){
  console.log(object);
  console.log("Send Response" + Object.entries(object));


  if ( !Array.isArray(object) ) {
  
    res.json({ "stockData" : {"stock": Object.keys(object)[0], 
                              "price" : Object.values(object)[0],
                              "likes" : 0, } });
  } else {

    let resultObjArr = [];

    for (let i = 0 ; i < object.length; i++ ) {

      resultObjArr.push({ 'stock' : Object.keys(object[i])[0], 
                          'price' : Object.values(object[i])[0],
                          'likes' : 0 });
    }
    res.json({ "stockData" : resultObjArr });
  }

};