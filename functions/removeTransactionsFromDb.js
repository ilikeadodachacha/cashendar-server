const item = require('./controllers/itemController');
const user = require('./controllers/userController');

function removeTransactionsFromDb(request, response) {
  const itemId = request.body.itemId;
  const plaidRemovedTransactions = request.body.removedTransactions;
  let uniqueUserId;
  let transactions;
  let transactionInfo;

  Promise.all([
    item.getUserIdByItemFromDB(itemId),
    item.getItemTransactionsFromDB(itemId)])
    .then((result) => {
      uniqueUserId = result[0];
      transactions = result[1];
      const transactionsToRemove = [];
      const transactionsToRemoveDates = {};
      const transactionDates = Object.keys(transactions);

      plaidRemovedTransactions.forEach((transactionId) => {
        for (let i = 0; i < transactionDates.length; i += 1) {
          const date = transactionDates[i];
          if (transactions[date][transactionId]) {
            transactionsToRemove.push([date, transactionId]);
            transactionsToRemoveDates[date] = true;
            break;
          }
        }
      });

      transactionInfo = { transactionsToRemove, transactionsToRemoveDates };
      const removeTransactionPromise = transactionInfo.transactionsToRemove.map(dateAndId =>
        item.removeTransactions(itemId, dateAndId[0], dateAndId[1]));
      return Promise.all(removeTransactionPromise);
    })
    .then(() => user.updateDatesToScheduleQueue(uniqueUserId, Object.keys(transactionInfo.transactionsToRemoveDates)))
    .then(() => response.send(uniqueUserId));
}

module.exports = removeTransactionsFromDb;
