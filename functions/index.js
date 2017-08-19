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
  BCH: 'Bitcoin Cash',
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
  USD: 'Dollars',
};

const cryptoPrices = (request, response) => {

  const getPrice = (assistant) => {
    let fromCoin = assistant.getArgument(CRYPTO_COIN);
    let coinNameLongOrShort = assistant.getArgument(CURRENCY_NAME) ||
    assistant.getArgument(CRYPTO_COIN2) ||
    'USD';

    let toCoin = shortName(coinNameLongOrShort.toUpperCase());
    console.log('tocoin from tocoinlf', toCoin);

    if (fromCoin === null) {
      assistant.ask('Hi, which cryptocoin would you like the price for?');
    } else {
      let getPriceRequest =
      pricePromise(fromCoin, toCoin)
      .then(getToCoinPriceFromBody(toCoin))
      // .then(formatToCoinPrice(toCoinPrice))
      .then(generateMessageFn(fromCoin, toCoin))
      .then(respondWithMessage)
      .catch(console.error);
    }
  };

  const coins = Object.keys(coinFullNames).map(short => ({
    shortName: short.toUpperCase(),
    longName: coinFullNames[short].toUpperCase(),
  }));

  const shortName = (name) => coins.find((coin) => coin.longName === name || coin.shortName === name).shortName;

  const pricePromise = (fromCoin, toCoin) => {
    console.log('arguments are: ', fromCoin, toCoin);
    const baseUrl = 'https://min-api.cryptocompare.com/data/';
    let url = `${baseUrl}price?fsym=${fromCoin}&tsyms=${toCoin}`;
    return fetchJSON(url);
  };

  const fetchJSON = url => {
    return fetch(url).then(res => res.json()).then(body => {
      if (body.Response === 'Error') {
        throw body.Message;
      }

      console.log('fetchJSON triggered');
      return body;
    });
  };

  const getToPriceCoinFromBody = toCoin => body => body[toCoin];

  // const formatToCoinPrice = toCoinPrice => {
  //   if (toCoinPrice && toCoinPrice < 1) {
  //     return toCoinPrice.toFixed(4);
  //   }
  //
  //   return toCoinPrice.toFixed(2);
  // };

  const generateMessageFn = (fromCoin, toCoin) => (toCoinPrice) => {
    if (toCoin === 'USD') {
      return (`The current price of ${coinFullNames[fromCoin]} is $${toCoinPrice}.`
       );
    }

    return (`The current price of ${coinFullNames[fromCoin]} is ${toCoinPrice}
       ${coinFullNames[toCoin]}.`
     );
  };

  const respondWithMessage = message => assistant.tell(message);

  const assistant = new Assistant({ request: request, response: response });

  let actionMap = new Map();
  actionMap.set(WELCOME_INTENT, getPrice);
  actionMap.set(GET_PRICE_INTENT, getPrice);
  assistant.handleRequest(actionMap);

};

exports.cryptoCurrencyPrices = functions.https.onRequest(cryptoPrices);
