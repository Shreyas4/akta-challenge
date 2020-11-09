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
let jobsQueue = [];

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

async function processJob(job) {
    let input = job.input;
    let id = job.id;
    con.query(`INSERT INTO jobs_submitted(id, status) VALUES (${id}, 'queued')`);
    let errorCode;
    if (input.length < 6)
        errorCode = 8;
    else
        errorCode = getErrorCode(input);
    updateJobsTable(id, input, errorCode).then();
    console.log(`JOB_ID: ${id} ERROR_CODE: ${errorCode}`)
    return errorCode;
}

async function updateJobsTable(id, input, errorCode){
    if(errorCode===0)
        bcrypt.hash(input, 10, (err, hash) => {
            let hashRes = `JOB_ID: ${id} COMPUTED_HASH: ${hash}`;
            console.log(hashRes);
            con.query(`UPDATE jobs_submitted SET status="success", result="${hashRes}" WHERE id=${id}`);
        });
    else
        con.query(`UPDATE jobs_submitted SET status="error" WHERE id=${id}`);
}

function acceptJob(input, res) {
    jobId++;
    jobsQueue.push({
        'id': jobId,
        'input': input
    });
    res.end(JSON.stringify({
        'id': jobId
    }));
}

function getJobDetails(id, res) {
    if(id<1)
        res.end(400);
    else
        con.query(`SELECT status, result FROM jobs_submitted WHERE id=${id}`, function (error, results) {
            if (error)
                res.end(400);
            else
                res.end(JSON.stringify(results));
        });
}

setInterval(function() {
    if (jobsQueue.length > 0)
        processJob(jobsQueue.shift()).then();
}, 10);

module.exports = {
    submitJob: acceptJob,
    getJobDetails: getJobDetails
}