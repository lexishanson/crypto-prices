'use strict';

process.env.DEBUG = 'actions-on-google:*';

const Assistant = require('actions-on-google').ApiAiAssistant;
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
global.fetch = require('node-fetch');

// API.AI Intent names
const WELCOME_INTENT = 'input.welcome';
const GET_PRICE_INTENT = 'get.price';
const QUIT_INTENT = 'quit';

// Contexts
const WELCOME_CONTEXT = 'welcome';
const GET_PRICE_CONTEXT = 'get-price';

// Context Parameters
const CRYPTO_COIN = 'crypto-coin';
const CRYPTO_COIN2 = 'crypto-coin2';
const CURRENCY_NAME = 'currency-name';

const coinFullNames = {
  // cryptocurrencies
  BTC: 'Bitcoin',
  DASH: 'Digital Cash',
  DOGE: 'Dogecoin',
  ETC: 'Ethereum Classic',
  ETH: 'Ethereum',
  GNT: 'Golem',
  IOT: 'Iota',
  LTC: 'Litecoin',
  SC: 'Siacoin',
  STRAT: 'Stratis',
  XMR: 'Monero',
  XRP: 'Ripple',
  // traditional currencies
  AUD: 'Australian Dollars',
  CAD: 'Canadian Dollars',
  CNY: 'Yuan',
  EUR: 'Euros',
  GBP: 'British Pounds',
  INR: 'Indian Rupees',
  JPY: 'Yen',
  USD: 'US Dollars'
};

exports.cryptoCurrencyPrices = functions.https.onRequest((request, response) => {

  const fetchJSON = (url) => {
    return fetch(url).then(res => res.json()).then(body => {
      if (body.Response === 'Error') {
        throw body.Message;
      }
      return body;
    });
  };

  const price = (fromCoin, toCoin, options) => {
    options = options || {};
    console.log('arguments are: ', arguments);
    const baseUrl = 'https://min-api.cryptocompare.com/data/';
    let url = `${baseUrl}price?fsym=${fromCoin}&tsyms=${toCoin}`;
    return fetchJSON(url);
  };

  const generateMessageFunction = (coinFullNames, fromCoin, toCoin) => (toCoinPrice) => {
    return (`The current price of ${coinFullNames[fromCoin]} is ${toCoinPrice}
       ${coinFullNames[toCoin]}`
     );
  };

  const getPrice = (assistant) => {
    let fromCoin = assistant.getArgument(CRYPTO_COIN);
    let toCoin = assistant.getArgument(CURRENCY_NAME) ||
    assistant.getArgument(CRYPTO_COIN2) ||
    'USD';
    if (fromCoin === null) {
      assistant.ask('Hi, which cryptocoin would you like the price for?');
    } else {
      let getPrice = price(fromCoin, toCoin)
      .then(body => body[toCoin])
      .then(generateMessageFunction(coinFullNames, fromCoin, toCoin))
      .then(message => assistant.tell(message))
      .catch(console.error);
    }
  };

  console.log('headers: ' + JSON.stringify(request.headers));

  const assistant = new Assistant({request: request, response: response});

  let actionMap = new Map();
  actionMap.set(WELCOME_INTENT, getPrice);
  actionMap.set(GET_PRICE_INTENT, getPrice);
  assistant.handleRequest(actionMap);

});
