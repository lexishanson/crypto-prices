const existingCoins = require("./dialogFlowEntities");
const ApiCoinNames = require("../functions/ApiCoinNames");
fs = require("fs");

const addNewCoins = () => {
  var combinedUniqueCoins = existingCoins;
  for (var apiCoin in ApiCoinNames) {
    var coinExistsAlready = existingCoins.some(existingCoin => {
      return existingCoin.value === apiCoin;
    });
    if (!coinExistsAlready) {
      combinedUniqueCoins.push({
        value: apiCoin,
        synonyms: [apiCoin, ApiCoinNames[apiCoin]]
      });
    }
  }
  return combinedUniqueCoins;
};
console.log(addNewCoins());

fs.writeFile("./combinedNewCoins.js", JSON.stringify(addNewCoins()), "utf-8");
