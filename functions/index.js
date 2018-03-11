'use strict';

process.env.DEBUG = 'actions-on-google:*';

const Assistant = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');
const admin = require('firebase-admin');
global.fetch = require('node-fetch');

admin.initializeApp(functions.config().firebase);

const API_COIN_NAMES = require('./ApiCoinNames');

const COIN_AND_FIAT_LONG_NAMES = Object.assign(API_COIN_NAMES, {
  AUD: 'Australian Dollars',
  CAD: 'Canadian Dollars',
  CNY: 'Yuan',
  EUR: 'Euros',
  GBP: 'British Pounds',
  INR: 'Indian Rupees',
  JPY: 'Yen',
  USD: 'Dollars'
});

const COIN_AND_FIAT_SHORT_NAMES = Object.keys(COIN_AND_FIAT_LONG_NAMES).reduce(
  (acc, key) => {
    acc[COIN_AND_FIAT_LONG_NAMES[key]] = key;
    return acc;
  },
  {}
);

// API.AI Intent names
const GET_PRICE_INTENT = 'get.price';

// Context Parameters
const PRIMARY_COIN = 'crypto-coin';
const RELATIVE_TO_COIN = 'crypto-coin2';
const RELATIVE_TO_CURRENCY = 'currency-name';

/* ----- GET COIN PRICE FROM API ----- */

const fetchPrice = (fromCoin, toCoin) => {
  console.log('arguments are: ', fromCoin, toCoin);
  const apiBaseURL = 'https://min-api.cryptocompare.com/data/';
  let url = `${apiBaseURL}price?fsym=${fromCoin}&tsyms=${toCoin}`;
  return fetch(url)
    .then(res => res.json())
    .then(body => {
      if (body.Response === 'Error') {
        throw body.Message;
      }
      return body[toCoin];
    });
};

/* ----- COMPOSE PRICE RESPONSE ----- */

const composePriceResponseFn = (fromCoin, toCoin) => longToCoinPrice => {
  const toCoinPrice = longToCoinPrice.toFixed(longToCoinPrice < 1 ? 4 : 2);
  if (toCoin === 'USD') {
    return `The current price of ${
      COIN_AND_FIAT_LONG_NAMES[fromCoin]
    } is $${toCoinPrice}.`;
  }
  return `The current price of ${
    COIN_AND_FIAT_LONG_NAMES[fromCoin]
  } is ${toCoinPrice}
     ${COIN_AND_FIAT_LONG_NAMES[toCoin]}.`;
};

/* ----- GET INFORMATION FROM PRICE REQUEST ----- */

const fromAndToCoins = assistant => {
  const shortName = shortOrLongName =>
    COIN_AND_FIAT_SHORT_NAMES[shortOrLongName] ||
    (COIN_AND_FIAT_LONG_NAMES[shortOrLongName] && shortOrLongName);
  const fromCoin = assistant.getArgument(PRIMARY_COIN);
  const relativeToCurrency = assistant.getArgument(RELATIVE_TO_CURRENCY);
  const relativeToCoin = assistant.getArgument(RELATIVE_TO_COIN);
  const toCoin = shortName(
    (relativeToCurrency || relativeToCoin || 'USD').toUpperCase()
  );
  // TODO check if we can reduce parsing
  return { fromCoin, toCoin };
};

/* ----- CONTROL A SINGLE PRICE REQUEST ----- */

const getPriceResponse = (fromCoin, toCoin = 'USD') => {
  return new Promise((resolve, reject) => {
    if (!!fromCoin) {
      fetchPrice(fromCoin, toCoin) // get coin data from API
        .then(composePriceResponseFn(fromCoin, toCoin)) // build response message with COIN_AND_FIAT_LONG_NAMES
        .then(resolve) // send response message to Google Assistant
        .catch(console.error);
    } else {
      resolve('Sorry, that coin is unavailable.');
    }
  });
};

const getPrice = assistant => {
  const fromAndTo = fromAndToCoins(assistant);
  return getPriceResponse(fromAndTo.fromCoin, fromAndTo.toCoin)
    .then(x => {
      return assistant.tell(x);
    })
    .catch(response.status(400).send({ error: 'error finding that coin' }));
};

/* ----- DEFINE REQUESTS ACCEPTED FROM USER ----- */

const cryptoPrices = (request, response) => {
  const assistant = new Assistant({ request: request, response: response });
  let actionMap = new Map();
  actionMap.set(GET_PRICE_INTENT, getPrice);
  assistant.handleRequest(actionMap);
};

const runTest = (fromCoin, toCoin) => {
  return getPriceResponse(fromCoin, toCoin).then(
    response => `TEST ${fromCoin} -> ${toCoin}: ${response}`
  );
};

exports.testGetPriceResponse = functions.https.onRequest((req, res) => {
  Promise.all([
    runTest('BTC', 'EUR'),
    runTest('LTC'),
    runTest('ETH', 'USD'),
    runTest()
  ]).then(tests => res.send(console.log(tests.join('\n'))));
});

exports.cryptoCurrencyPrices = functions.https.onRequest(cryptoPrices);
