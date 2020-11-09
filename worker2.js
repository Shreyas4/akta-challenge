const bcrypt = require('bcrypt');
process.stdin.setEncoding('utf8');

process.stdin.on('data', (input) => {
    process.exit(getErrorCode(input.toString()));
});

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
    if (errorCode === 0)
        process.stdout.write(bcrypt.hashSync(input, 10));
    return errorCode
}