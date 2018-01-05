const coinObject = require('../functions/coin-object').coinObject;
fs = require('fs');

// const coinArray = Object.keys(coinObject).reduce((acc, key) => {
//   acc.push({
//     "value": key,
//     "synonyms": [key, coinObject[key]]
//   });
//   return acc;
// }, []);


// const reducer = (coin, coinSym) => {
//   console.log(coin, coinSym);
//   const value = coinList[coinSym];
//   coin[coinSym] = value.CoinName;
//   return coin;
// };
//
// const coinObj = Object.keys(coinObject).reduce(reducer, {});
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
fs.writeFile('./coinobject.js', JSON.stringify(coinObject))
