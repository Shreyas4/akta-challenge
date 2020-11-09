const bcrypt = require('bcrypt');

process.exit(getErrorCode(process.argv[2]));
function getErrorCode(input) {
    let errorCode = 0;
    if (input.length < 6)
        errorCode = 8;
    else {
        let caps = false, smalls = false, nums = false;
        for (let ch of input)
            if (!isNaN(ch * 1))
                nums = true;
            else if (ch === ch.toUpperCase())
                caps = true;
            else if (ch === ch.toLowerCase())
                smalls = true;
        errorCode += !caps?1:0;
        errorCode = errorCode * 2;
        errorCode += !smalls?1:0;
        errorCode = errorCode * 2;
        errorCode += !nums?1:0;
        if (errorCode === 0)
            process.stdout.write(bcrypt.hashSync(input, 10));
    }
    return errorCode
}