const item = require('./controllers/itemController');
const axios = require('axios');
const creds = require('./creds.json');

function plaidWebHook(request, response) {
  const itemId = request.body.item_id;
  const webHookCode = request.body.webhook_code;
  const newTransactions = request.body.new_transactions || null;
  console.log('WEBHOOK HIT:', itemId, webHookCode, newTransactions);

  if (webHookCode === 'HISTORICAL_UPDATE') {
    response.end();
  } else if (webHookCode === 'TRANSACTIONS_REMOVED') {
    const config = {
      url: `${creds.HOST}removeTransactionsFromDb`,
      payload: {
        itemId,
        removedTransactions: request.body.removed_transactions,
      },
    };

    axios.post(config.url, config.payload)
      .then(uniqueUserId =>
        axios.post(`${creds.HOST}addCalendarEvents`, { uniqueUserId: uniqueUserId.data }))
      .then(response.end())
      .catch(e => console.log('TRANSACTIONS_REMOVED ERROR!:', e));
  } else {
    item.getItemFromDB(itemId)
      .then((itemData) => {
        if (itemData) {
          const config = {
            url: `${creds.HOST}getTransactionsFromPlaid`,
            payload: {
              access_token: itemData.access_token,
              uniqueUserId: itemData.uniqueUserId,
              newTransactions,
            },
          };
          axios.post(config.url, config.payload)
            .then(() => axios.post(`${creds.HOST}addCalendarEvents`, config.payload))
            .then(() => response.end())
            .catch(e => console.log('plaidWebHook Error!:', e));
        } else {
          response.end();
        }
      });
  }
}

module.exports = plaidWebHook;
