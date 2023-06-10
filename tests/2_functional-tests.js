const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    this.timeout(2000);
    test("Viewing one stock: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.deepInclude(res.body, { "stock" : "GOOG" });
                assert.deepProperty(res.body, 'price');
                done();
            });
    });
    let likesCount;
    test("Viewing one stock and liking it: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.deepInclude(res.body, { "stock" : "GOOG" });
                assert.deepProperty(res.body, 'likes');
                likesCount = +res.body.stockData.likes;
                done();
            });
    });
    test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", (done) =>{
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.deepEqual(res.body, { "likes" : likesCount });
                done();
            });
    });
    let rel_likes;
    let stockName;
    test("Viewing two stocks: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&stock=MSFT')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.property(res.body, 'stockData');
                assert.deepInclude(res.body, { "stock" : "MSFT" });
                assert.deepInclude(res.body, { "stock" : "GOOG" });
                assert.deepProperty(res.body, "rel_likes");   
                rel_likes = res.body.stockData[0].rel_likes;
                stockName = res.body.stockData[0].stock;
                assert.deepEqual(res.body, { 'rel_likes' :  -rel_likes });
                done();
            });
    });
    test("Viewing two stocks and liking them: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.deepEqual(res.body, { "rel_likes" : rel_likes });
                done();
            });
                
    });

});
