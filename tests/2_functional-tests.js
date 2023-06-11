const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    this.timeout(5000);
    test("#1 Viewing one stock: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, "application/json");
                assert.include(res.body.stockData, { 'stock' : 'GOOG' });
                assert.nestedProperty(res.body, 'stockData.price');
                done();
            });
    });
    test("#2 Viewing one stock and liking it: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.include(res.body.stockData, { "stock" : "GOOG" });
                assert.include(res.body.stockData, { 'likes' : 1 } );
                done();
            });
    });
    test("#3 Viewing the same stock and liking it again: GET request to /api/stock-prices/", (done) =>{
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.include(res.body.stockData, { "likes" : 1 });
                done();
            });
    });
    let rel_likes;
    test("#4 Viewing two stocks: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&stock=MSFT')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.property(res.body, 'stockData');
                expect(res.body.stockData.map(e=>(e.stock))).to.include('MSFT');
                rel_likes = res.body.stockData[0].rel_likes;
                done();
            });
    });
    test("#5 Viewing two stocks and liking them: GET request to /api/stock-prices/", (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.include(res.body.stockData[0], { "rel_likes" : rel_likes });
                done();
            });
                
    });

});
