
function isBlank(str) {
    return (!str || /^\s*$/.test(str) || str == null);
}

function isTrue(value) {
    return  (value == 'true' || value == true);
}

 function isValidDate(date) {
    var x = Date.parse(date);
    // return x === NaN;
    if (isNaN(x)) {
        return  true;
    }

    return  false;
  //  return await Date.parse(date) && Object.prototype.toString.call(Date.parse(date)) === "[object Date]" && !isNaN(Date.parse(date));
}




function isDateEmpty(date, res) {

    var x = new Date(date);

    // check if date is not empty
    if (date.toString().trim() == '') {
        return  false;
    }
    return true;

}


// --------------------------
//      API RESPONSES 
// --------------------------
 function sendResponse(responseCode ,res, message) {
     res.status(responseCode)
        .setHeader('content-type', 'application/json')
        .send({ message }); // resource not found
}



module.exports = { isBlank, isTrue, isValidDate, sendResponse, isDateEmpty };