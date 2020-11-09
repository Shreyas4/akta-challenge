const mysql = require('mysql');
const bcrypt = require('bcrypt');
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

// job counter
let jobId = 0;

function getErrorCode(input) {
    let errorCode = 0;
    let caps = false, smalls = false, nums = false;
    for (let ch of input)
        if (!isNaN(ch * 1))
            nums = true;
        else if (ch === ch.toUpperCase())
            caps = true;
        else if (ch === ch.toLowerCase())
            smalls = true;
    if (!caps)
        errorCode += 1;
    errorCode = errorCode * 2;
    if (!smalls)
        errorCode += 1;
    errorCode = errorCode * 2;
    if (!nums)
        errorCode += 1;
    return errorCode
}

async function processJob(id, input) {
    con.query(`INSERT INTO jobs_submitted(id, status) VALUES (${id}, 'queued')`);
    let errorCode;
    if (input.length < 6)
        errorCode = 8;
    else
        errorCode = getErrorCode(input);

    bcrypt.hash(input, 10, (err, hash) => {
        if (errorCode === 0)
            console.log(hash);
        con.query(`UPDATE jobs_submitted SET status="${errorCode === 0 ? 'success' : 'error'}", result="${errorCode === 0 ? hash : ''}" WHERE id=${jobId}`);
    });
    return errorCode;
}

function acceptJob(input, res) {
    jobId++;
    processJob(jobId, input).then(r => console.log(jobId, input, r));
    res.end(JSON.stringify({
        'id': jobId
    }));
}

function getJobDetails(id, res) {
    if(id<1)
        res.end(400);
    else
        con.query(`SELECT status, result FROM jobs_submitted WHERE id=${id}`, function (error, results) {
            if (error) throw error
            res.end(JSON.stringify(results));
        });
}

module.exports = {
    submitJob: acceptJob,
    getJobDetails: getJobDetails
}