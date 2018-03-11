'use strict';

process.env.DEBUG = 'actions-on-google:*';

const Assistant = require('actions-on-google').ApiAiAssistant;
const functions = require('firebase-functions');
const admin = require('firebase-admin');

global.fetch = require('node-fetch');

admin.initializeApp(functions.config().firebase);

// Coin names
const API_COIN_NAMES = require('./ApiCoinNames');

// API.AI Intent names
const GET_PRICE_INTENT = 'get.price';
const QUIT_INTENT = 'quit';

// Contexts
const WELCOME_CONTEXT = 'welcome';
const GET_PRICE_CONTEXT = 'get-price';

// Context Parameters
const CRYPTO_COIN = 'crypto-coin';
const CRYPTO_COIN2 = 'crypto-coin2';
const CURRENCY_NAME = 'currency-name';

const coinFullNames = Object.assign(API_COIN_NAMES, {
  AUD: 'Australian Dollars',
  CAD: 'Canadian Dollars',
  CNY: 'Yuan',
  EUR: 'Euros',
  GBP: 'British Pounds',
  INR: 'Indian Rupees',
  JPY: 'Yen',
  USD: 'Dollars'
});

const getCoinPriceFromCache = (fromCoin, toCoin) => {};

const addCoinPriceToCache = () => {};

const cryptoPrices = (request, response) => {
  const getPrice = assistant => {
    const fromCoin = assistant.getArgument(CRYPTO_COIN);
    const coinNameLongOrShort =
      assistant.getArgument(CURRENCY_NAME) ||
      assistant.getArgument(CRYPTO_COIN2) ||
      'USD';

    const toCoin = shortName(coinNameLongOrShort.toUpperCase());

    if (fromCoin === null) {
      assistant.ask('Hi, which cryptocurrency would you like the price for?');
    } else {
      const getPriceRequest = fetchPrice(fromCoin, toCoin) // get coin data from API
        .then(getToCoinPriceFromBody(toCoin)) // parse price of coin from result
        .then(formatToCoinPrice) // format coin price to shortened, readable value
        .then(generateMessageFn(fromCoin, toCoin)) // build response message with coinFullNames
        .then(respondWithMessage) // send response message to Google Assistant
        .catch(console.error);
    }
  };

  const coins = Object.keys(coinFullNames).map(short => ({
    shortName: short.toUpperCase(),
    longName: coinFullNames[short].toUpperCase()
  }));

  const shortName = name =>
    coins.find(coin => coin.longName === name || coin.shortName === name)
      .shortName;

  const fetchPrice = (fromCoin, toCoin) => {
    console.log('arguments are: ', fromCoin, toCoin);
    const baseUrl = 'https://min-api.cryptocompare.com/data/';
    let url = `${baseUrl}price?fsym=${fromCoin}&tsyms=${toCoin}`;
    return fetchJSON(url);
  };

  const fetchJSON = url =>
    fetch(url)
      .then(res => res.json())
      .then(body => {
        if (body.Response === 'Error') {
          throw body.Message;
        }
        return body;
      });

  const getToCoinPriceFromBody = toCoin => body => body[toCoin];

  const formatToCoinPrice = toCoinPrice => {
    if (toCoinPrice < 1) {
      return toCoinPrice.toFixed(4);
    }
    return toCoinPrice.toFixed(2);
  };

  const generateMessageFn = (fromCoin, toCoin) => toCoinPrice => {
    if (toCoin === 'USD') {
      return `The current price of ${
        coinFullNames[fromCoin]
      } is $${toCoinPrice}.`;
    }

    return `The current price of ${coinFullNames[fromCoin]} is ${toCoinPrice}
       ${coinFullNames[toCoin]}.`;
  };

  const respondWithMessage = message => assistant.tell(message);

  const assistant = new Assistant({ request: request, response: response });

  let actionMap = new Map();
  actionMap.set(GET_PRICE_INTENT, getPrice);
  assistant.handleRequest(actionMap);
};

exports.cryptoCurrencyPrices = functions.https.onRequest(cryptoPrices);
