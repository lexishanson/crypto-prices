const coinObject = require('../functions/coin-object').coinObject;
fs = require('fs');

var coinEntity = {};

const coinArray = Object.keys(coinObject).reduce((acc, key) => {
  acc.push({
    "value": key,
    "synonyms": [key, coinObject[key]]
  });
  return acc;
}, []);

// {
//     "value": "XVG",
//     "synonyms": [
//         "Verge",
//         "XVG",
//         "verj",
//         "verje",
//         "verge"
//     ]
// }
// {coinObject: {'BTC': Bitcoin.......ethereum rpple}......}
fs.writeFile('./hellocoins.js', JSON.stringify(coinArray))
