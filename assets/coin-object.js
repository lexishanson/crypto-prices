const coinList = require("./coin-list.json");

const reducer = (coin, coinSym) => {
  // console.log(coin, coinSym);
  const value = coinList[coinSym];
  coin[coinSym] = value.CoinName;
  return coin;
};

const coinObject = Object.keys(coinList).reduce(reducer, {});

module.exports = coinObject;
