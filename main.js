const Borderau = require("./Equity/borderau");

const main = async (context) => {
  const response = await Borderau(context);
  console.log(response);
}

main({ liquidationId: 104});