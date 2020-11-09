const restify = require('restify');
const worker = require('./worker')

// REST server
const server = restify.createServer({
    name: 'akta-challenge-rest-server',
    version: '1.0.0',
    url: 'http://localhost',
});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.listen(4000, function () {
    console.log('%s listening at %s', server.name, server.url);
});

// API Endpoints

server.post('/jobs', function (req, res) {
    if (!req.body || !req.body.input)
        res.end(400);
    else
        worker.submitJob(req.body.input, res);
});

server.get('/jobs/:id', function (req, res) {
    if(!req.params.id)
        res.end(400);
    else
        worker.getJobDetails(req.params.id, res);
});
