const cmdGetAdditionalCommission = require('./Equity/cmdGetAdditionalCommission')
const main = async () => {
   return await cmdGetAdditionalCommission({ row: { policyId: 16117 }});
}

main();