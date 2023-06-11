'use strict';

const mongoose = require('mongoose');
const https = require('node:https');
const { resolve } = require('node:path');
const bcrypt = require('bcrypt');
const saltRounds = 8;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let stockSchema = new mongoose.Schema({
  stock: String,
  ip: [],
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

//Function to make ASYNC requests incl multiple through API
let makeRequest = function(req, res) {

  console.log(req.query);

  if (Array.isArray(req.query.stock)) {
    
    let promiseArray = [];

    for (let i = 0; i < req.query.stock.length; i++) {
      let reqUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'+ req.query.stock[i] +'/quote';  
      promiseArray.push(callApi(reqUrl));
    }

    Promise.all(promiseArray)
           .then( (value) => {
              let arr = value.map(r => readLikes(r, req));

              return Promise.all(arr);
           })
           .then((value) => {
              sendResponse(value, req, res)
           })


  } else {

    let reqUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'+ req.query.stock +'/quote';
    let promise = callApi(reqUrl);

    promise.then(value => readLikes(value, req))
           .then((value) => {
                sendResponse(value, req, res);
           });
  }

};

// Check whether like from current IP in DB, create requests to DB
function readLikes(object, req) {
  return new Promise(function(resolve, reject) {
    
    let objToFind = { stock: Object.keys(object)[0] }

    StockInstance.findOne(objToFind)
                 .then( (data) => {
                            //console.log(data);

                            if (!data && req.query.likes == true) {
                
                              createNewRecord(objToFind, req.ip);
                              resolve({ stock: Object.keys(object)[0],
                                price: Object.values(object)[0],
                                likes: 1,
                              });

                            } else if (!data) {
                              
                              createNewRecord(objToFind, '');
                              resolve({ stock: Object.keys(object)[0],
                                price: Object.values(object)[0],
                                likes: 0,
                              });

                            } else if ( !data.ip.some(elem => bcrypt.compareSync(req.ip, elem)) && (req.query.like == 'true') ) {
                            //} else if ( !data.ip.includes(req.ip) && (req.query.like == 'true') ) {

                              updateRecordLikes(objToFind, req.ip);
                              resolve({ stock: Object.keys(object)[0],
                                price: Object.values(object)[0],
                                likes: +data.likes + 1,
                              });
                            } else {
                              resolve({ stock: Object.keys(object)[0],
                                        price: Object.values(object)[0],
                                        likes: data.likes,
                                      }) 
                            }

                })
                .catch( (err) => {
                      console.log(err);
                      reject(err);
                });

  });
}

//Write new record in DB
function createNewRecord(objToCreate, ip='') {
  let newRecord = new StockInstance({ stock: objToCreate.stock,
                                      ip: bcrypt.hashSync(ip, saltRounds),
                                      likes : 0,
                                    });
  newRecord.save()
           .then( (value) => console.log("New recored created!"))
           .catch( (err) => console.log(err));
}

//Update current record in DB
function updateRecordLikes(objToUpdate, ip) {

  StockInstance.findOne( objToUpdate)
               .then( (recordToUpdate) => {
                  recordToUpdate.likes = +recordToUpdate.likes + 1;
                  recordToUpdate.ip.push(bcrypt.hashSync(ip, saltRounds) );
                  recordToUpdate.save()
                                .then( (value) => console.log("Object updated!"))
                                .catch( (err) => console.log(err));
               })
               .catch( (err) => console.log(err));
}

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

//Function to send results
let sendResponse = function(object, req, res){
  //console.log("Send Response" + Object.entries(object));
  console.log(object);
  if ( !Array.isArray(object) ) {
  
    res.json({ "stockData" : {"stock": object.stock, 
                              "price" : +object.price,
                              "likes" : +object.likes, } });
  } else {

    let resultObjArr = [];
    let relLike = []; 
    relLike.push(+object[0].likes - +object[1].likes);
    relLike.push(+object[1].likes - +object[0].likes);
    for (let i = 0 ; i < 2; i++ ) {

      resultObjArr.push({ 'stock' : object[i].stock, 
                          'price' : +object[i].price,
                          'rel_likes' : +relLike[i] });
    }
    res.json({ "stockData" : resultObjArr });
  }

};