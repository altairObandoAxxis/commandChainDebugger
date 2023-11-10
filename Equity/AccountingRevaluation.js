const { doCmd } = require('../lib');
const AccountingRevaluation = async(context)=>{
    const today = new Date(),
          month = today.getMonth(),
          year  = today.getFullYear();
    //Obtain current transactions in foreign currency
    const query = `
        SELECT 
            det.xCurrency currency,
            SUM(det.debit) localAmount,
            SUM(det.xDebit) foreignAmount
        FROM
            [TransactionLine] det
        INNER JOIN [Transaction] t ON t.id = det.transactionId
        WHERE det.xCurrency IS NOT NULL
        AND det.xCurrency != 'KES'
        AND det.xCurrency IN ( SELECT code FROM InvestmentPlan )
        AND t.status = 1
        GROUP BY det.xCurrency
    `;
    await doCmd({ cmd:'DoQuery', data:{ sql: query }});
    if(!DoQuery.ok)
        throw '@' + DoQuery.msg;
    // Get new revaluation.
    const CurrencyEntries = DoQuery.outData;
    for(const CurrencyEntry of CurrencyEntries){
        // Get exchange rate 
        await doCmd({cmd:'LoadEntity', data:{ entity:'InvestmentPlanData', filter:`investmentPlanCode ='${ CurrencyEntry.currency }' AND CONVERT(DATE, [date])<= CONVERT(DATE, GETDATE()) ORDER BY [date] DESC`}})
        const { ok, msg, outData: { close }} = LoadEntity;
        if(!ok)
            throw '@'+msg;
        CurrencyEntry['newValue'] = CurrencyEntry.foreignAmount * close;
    }
    const AccumulatedValues = CurrencyEntries.reduce(( total, current ) => {
        total['oldValue'] += current.localAmount;
        total['newValue'] += current.newValue;
        total['diff'] = total.newValue - total.oldValue;
        return total;
    },{
        oldValue : 0,
        newValue : 0,
        diff: 0,
        month, 
        year
    });
    return [ AccumulatedValues ];
}

module.exports = { AccountingRevaluation }