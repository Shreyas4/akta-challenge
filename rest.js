const mysql = require('mysql');

// MySQL Connection Params
const con = mysql.createConnection({
    host: "localhost",
    user: "developer",
    password: "developer",
    database: "jobs"
});

// Auto-create customers table
con.connect(function (err) {
    if (err) throw err;
    let sql = "DROP TABLE IF EXISTS jobs_submitted";
    con.query(sql, function (err, result) {
        if (err) throw err;
    });
    sql = "CREATE TABLE jobs_submitted (id INT PRIMARY KEY, status VARCHAR(10), result VARCHAR(255))";
    con.query(sql, function (err, result) {
        if (err) throw err;
    });
});

const restify = require('restify');

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

// job counter
let jobId = 0;

// job queue
let jobsQueue = [];

// API Endpoints
server.post('/jobs', function (req, res) {
    if (!req.body || !req.body.input)
        res.end(400);
    else
        submitJob(req.body.input, res);
});
server.get('/jobs/:id', function (req, res) {
    if (!req.params.id)
        res.end(400);
    else
        getJobDetails(req.params.id, res).then();
});

// Helper Functions
function submitJob(input, res) {
    jobId++;
    jobsQueue.push({
        'id': jobId,
        'input': input
    });
    res.end(JSON.stringify({
        'id': jobId
    }));
}

async function getJobDetails(id, res) {
    if (id < 1)
        res.end(400);
    else
        con.query(`SELECT status, result FROM jobs_submitted WHERE id=${id}`, function (error, results) {
            if (error)
                res.end(400);
            else
                res.end(JSON.stringify(results));
        });
}

// Process jobs
setInterval(function () {
    if (jobsQueue.length > 0)
        processJob(jobsQueue.shift()).then();
}, 10);

const { execFile } = require('child_process');
async function processJob(job) {
    con.query(`INSERT INTO jobs_submitted(id, status) VALUES (${job.id}, 'queued')`);
    let childProcess = execFile('node', ['worker', job.input], ((error, stdout) => {
        if (childProcess.exitCode === 0)
            con.query(`UPDATE jobs_submitted SET status="success", result="${stdout}" WHERE id=${job.id}`);
        else
            con.query(`UPDATE jobs_submitted SET status="error" WHERE id=${job.id}`);
    }));
}