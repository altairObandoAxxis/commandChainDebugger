const { doCmd }= require('../lib')
const cmdDocument = async (context) => {
  //block
  await doCmd({
    cmd: "RepoLifePolicy",
    data: {
      operation: "GET",
      filter: "id=" + context.row.policyId,
      include: [
        "Holder",
        "Process",
        "Insureds",
        "Coverages",
        "Coverages.Loadings",
        "Coverages.Claims",
        "Coverages.Benefits",
        "Insureds.Contact",
        "Insureds.Contact.Occupation",
        "Surcharges",
        "Exclusions",
        "Clauses",
        "Documents",
        "PayPlan",
        "InvestmentPlan",
        "InvestmentSelections",
        "Beneficiaries",
        "Beneficiaries.Contact",
        "Requirements",
        "Events",
        "Accounts",
        "Accounts.Movements",
        "Accounts.PendingMovements",
        "Changes",
        "Changes.Bill",
        "Changes.BillUnique",
        "Changes.CancellationBill",
        "Changes.Process",
        "ComContract",
        "RiskAnalysis",
        "Tags",
        "Contingents",
        "ComContract.Contact",
        "ComContract.Commissions",
        "InsuredObjects",
      ],
      noTracking: true,
    },
  });
  //PLAN NAME FOR WHICH EVER PLAN ON CORPORATE POLICY
  let planName = "IMENA";
  context.row.datadoc = RepoLifePolicy.outData.pop();
  const MedicalCorporatePricing = context.row.datadoc.InsuredObjects.pop();
  if (
    typeof MedicalCorporatePricing === undefined ||
    MedicalCorporatePricing == null
  )
    throw `@This document requires MedicalCorporatePricing Insured Object`;
  // Get SellerName
  context.row.datadoc.sellerName = "Direct Bussiness";
  context.row.datadoc.planName = planName;
  context.row.datadoc.insuredTypedoc = "Corporate";
  if (context.row.datadoc.sellerId > 0) {
    await doCmd({
      cmd: "GetContacts",
      data: { filter: `id=${context.row.datadoc.sellerId}` },
    });
    context.row.datadoc.sellerName = GetContacts.outData.pop().FullName;
  } else {
    context.row.datadoc.sellerName = "";
  }

  context.row.datadoc.Clauses = context.row.datadoc.Clauses.sort((a, b) =>
    a.code > b.code ? 1 : a.code < b.code ? -1 : 0
  ).reduce((grupo, item) => {
    let indexElement = grupo.findIndex((temp) => temp.key == item.section);
    if (indexElement == -1) {
      grupo.push({ key: item.section, data: [item] });
      return grupo;
    }
    grupo[indexElement].data.push(item);
    return grupo;
  }, []);
  context.row.datadoc.hasClauses = context.row.datadoc.Clauses.length > 0;
  context.row.jsonValuesParse = JSON.parse(MedicalCorporatePricing.jValues); //JSON.parse(context.row.datadoc.InsuredObjects.find(x => x.objectDefinitionId == '3')[0].jValues);
  context.row.datadoc.customForm = {};
  const { userData: formValues } = MedicalCorporatePricing;
  context.row.datadoc.customForm.staffNumber =
    Number(formValues.m) +
    Number(formValues.m1) +
    Number(formValues.m2) +
    Number(formValues.m3) +
    Number(formValues.m4) +
    Number(formValues.m5) +
    Number(formValues.m6) +
    Number(formValues.m7) +
    Number(formValues.m8) +
    Number(formValues.m9) +
    Number(formValues.m10);
  context.row.datadoc.customForm.dependantNumber =
    Number(formValues.m) +
    Number(formValues.m1) * 2 +
    Number(formValues.m2) * 3 +
    Number(formValues.m3) * 4 +
    Number(formValues.m4) * 5 +
    Number(formValues.m5) * 6 +
    Number(formValues.m6) * 7 +
    Number(formValues.m7) * 8 +
    Number(formValues.m8) * 9 +
    Number(formValues.m9) * 10 +
    Number(formValues.m10) * 11 -
    context.row.datadoc.customForm.staffNumber;
  context.row.datadoc.customForm.planName = planName;
  context.row.datadoc.customForm.inpatientScope = context.row.jsonValuesParse
    .find((x) => x.name == "inpatientScope")
    .values.find((t) => t.value == formValues.inpatientScope).label;
  let inpatientCoverrr = Number(formValues.inpatient || 0);
  let outPatientCoverrr = Number(formValues.outpatient || 0);
  let maternityCoverrr = Number(formValues.maternity || 0);
  let opticalCoverrr = Number(formValues.optical || 0);
  let dentalCoverrr = Number(formValues.dental || 0);
  let ipLimit = inpatientCoverrr;
  let ip1Limit = Math.round((ipLimit * Number(formValues.subCongenital)) / 100);
  let ip2Limit = Math.round(
    (ipLimit * Number(formValues.subOphtalmologic)) / 100
  );
  let ip3Limit = Math.round((ipLimit * Number(formValues.subDental)) / 100);
  context.row.datadoc.customForm.ipLimit = ipLimit;
  context.row.datadoc.customForm.ip1Limit = ip1Limit;
  context.row.datadoc.customForm.ip2Limit = ip2Limit;
  context.row.datadoc.customForm.ip3Limit = ip3Limit;
  context.row.datadoc.customForm.inpatientCoverrr = inpatientCoverrr;
  context.row.datadoc.customForm.outPatientCoverrr = outPatientCoverrr;
  context.row.datadoc.customForm.maternityCoverrr = maternityCoverrr;
  context.row.datadoc.customForm.opticalCoverrr = opticalCoverrr;
  context.row.datadoc.customForm.dentalCoverrr = dentalCoverrr;
  let gradientChecked = formValues.gradientChecked || null;

  context.row.datadoc.customForm.hasOutPatientGradient = gradientChecked == "1";
  context.row.datadoc.customForm.hasDentalGradient = gradientChecked == "2";
  context.row.datadoc.customForm.hasOpticalGradient = gradientChecked == "3";
  context.row.datadoc.customForm.outpatientScopeGradient = "";
  context.row.datadoc.customForm.opLimitGradient = "";
  context.row.datadoc.customForm.opMemberGradient = "";
  context.row.datadoc.customForm.dentalScopeGradient = "";
  context.row.datadoc.customForm.dentalLimitGradient = "";
  context.row.datadoc.customForm.dentalMemberGradient = "";
  context.row.datadoc.customForm.opticalScopeGradient = "";
  context.row.datadoc.customForm.opticalLimitGradient = "";
  context.row.datadoc.customForm.opticalMemberGradient = "";
  let opLimit = parseFloat(
    context.row.jsonValuesParse.filter((x) => x.name == "outpatient")[0]
      .userData
  );
  context.row.datadoc.customForm.opLimit = opLimit;

  let outpatientScope = context.row.jsonValuesParse.filter(
    (x) => x.name == "outpatientScope"
  )[0].userData;
  context.row.datadoc.customForm.outpatientScope = context.row.jsonValuesParse
    .filter((x) => x.name == "outpatientScope")[0]
    .values.filter((t) => t.value == outpatientScope)[0].label;

  if (context.row.datadoc.customForm.hasOutPatientGradient) {
    let outpatientScopeG = context.row.jsonValuesParse.filter(
      (x) => x.name == "outpatientScopeG"
    )[0].userData;
    let opLimitG = parseFloat(
      context.row.jsonValuesParse.filter((x) => x.name == "outpatientG")[0]
        .userData
    );
    context.row.datadoc.customForm.outpatientScopeGradient =
      context.row.jsonValuesParse
        .filter((x) => x.name == "outpatientScopeG")[0]
        .values.filter((t) => t.value == outpatientScopeG)[0].label;
    context.row.datadoc.customForm.opLimitGradient = opLimitG;
    context.row.datadoc.customForm.opMemberGradient =
      context.row.jsonValuesParse.filter(
        (x) => x.name == "outpatientGradient"
      )[0].userData;
  }

  let matLimit = parseFloat(
    context.row.jsonValuesParse.filter((x) => x.name == "maternity")[0].userData
  );
  context.row.datadoc.customForm.matLimit = matLimit;

  let maternityScope = context.row.jsonValuesParse
    .filter((x) => x.name == "maternityScope")[0]
    .values.filter((v) => v.selected == true)[0].label;
  context.row.datadoc.customForm.maternityScope = maternityScope;

  let dentalLimit = parseFloat(
    context.row.jsonValuesParse.filter((x) => x.name == "dental")[0].userData
  );
  context.row.datadoc.customForm.dentalLimit = dentalLimit;

  let dentalScope = context.row.jsonValuesParse.filter(
    (x) => x.name == "dentalScope"
  )[0].userData;
  context.row.datadoc.customForm.dentalScope = context.row.jsonValuesParse
    .filter((x) => x.name == "dentalScope")[0]
    .values.filter((t) => t.value == dentalScope)[0].label;

  if (context.row.datadoc.customForm.hasDentalGradient) {
    let dentalScopeG = context.row.jsonValuesParse.filter(
      (x) => x.name == "dentalScopeG"
    )[0].userData;
    let dentalLimitG = parseFloat(
      context.row.jsonValuesParse.filter((x) => x.name == "dentalG")[0].userData
    );
    context.row.datadoc.customForm.dentalScopeGradient =
      context.row.jsonValuesParse
        .filter((x) => x.name == "dentalScopeG")[0]
        .values.filter((t) => t.value == dentalScopeG)[0].label;
    context.row.datadoc.customForm.dentalLimitGradient = dentalLimitG;
    context.row.datadoc.customForm.dentalMemberGradient =
      context.row.jsonValuesParse.filter(
        (x) => x.name == "dentalGradient"
      )[0].userData;
  }

  let opticalLimit = parseFloat(
    context.row.jsonValuesParse.filter((x) => x.name == "optical")[0].userData
  );
  context.row.datadoc.customForm.opticalLimit = opticalLimit;

  let opticalScope = context.row.jsonValuesParse.filter(
    (x) => x.name == "opticalScope"
  )[0].userData;
  context.row.datadoc.customForm.opticalScope = context.row.jsonValuesParse
    .filter((x) => x.name == "opticalScope")[0]
    .values.filter((t) => t.value == opticalScope)[0].label;

  if (context.row.datadoc.customForm.hasOpticalGradient) {
    let opticalScopeG = context.row.jsonValuesParse.filter(
      (x) => x.name == "opticalScopeG"
    )[0].userData;
    let opticalLimitG = parseFloat(
      context.row.jsonValuesParse.filter((x) => x.name == "opticalG")[0]
        .userData
    );
    context.row.datadoc.customForm.opticalScopeGradient =
      context.row.jsonValuesParse
        .filter((x) => x.name == "opticalScopeG")[0]
        .values.filter((t) => t.value == opticalScopeG)[0].label;
    context.row.datadoc.customForm.opticalLimitGradient = opticalLimitG;
    context.row.datadoc.customForm.opticalMemberGradient =
      context.row.jsonValuesParse.filter(
        (x) => x.name == "opticalGradient"
      )[0].userData;
  }

  await doCmd({
    cmd: "GetTableRows",
    data: {
      table: "MedicalCorporateFUNERALTariff",
      column: " TIPO TARIFICACION ",
      filterValue: " TF ",
      getColumn1: " TIPO TARIFICACION ",
      getColumn2: ipLimit,
    },
  });
  let lastExpenseLimit = parseFloat(GetTableRows.outData[0].column2);
  context.row.datadoc.customForm.lastExpenseLimit = lastExpenseLimit;

  /*Get Fields to print on Full Insurance Quotations*/
  context.row.datadoc.customForm.totalBasePremium = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.totalBasePremium
    )
  );

  context.row.datadoc.customForm.mds = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.mds
    )
  );

  context.row.datadoc.customForm.adminFee = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.adminFee
    )
  );

  context.row.datadoc.customForm.totalInsuranceSide = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.totalInsuranceSide
    )
  );

  /*Get Fields to print on Fund Management Quotations*/
  context.row.datadoc.customForm.estimatedFundSize = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.totalBaseInsuranceSide
    )
  );

  context.row.datadoc.customForm.fundAdminFee = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.fundFee
    )
  );

  context.row.datadoc.customForm.vat = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.vat
    )
  );

  context.row.datadoc.customForm.totalFundAmount = Math.round(
    parseFloat(
      MedicalCorporatePricing.userData.totalFundAmount
    )
  );

  /*Get Total Amount*/
  context.row.datadoc.customForm.formTotalPremium =
    context.row.datadoc.customForm.totalInsuranceSide +
    context.row.datadoc.customForm.totalFundAmount;

  /*let branch = context.row.jsonValuesParse.filter(x => x.name == 'branch')[0].values.filter(t => t.selected == true)[0].label;*/
  let branchId = context.row.datadoc.branchCode || 1;

  /* Get branch name from BRANCH TABLE using the branchId caugth on the InsuredObject*/
  await doCmd({
    cmd: "GetTable",
    data: {
      table: "PrimeBranchAndFranchiseList",
      column: "S/N",
      row: branchId.toString(),
      getColumn: "Branch Name",
      notFoundValue: null,
      useCache: false,
    },
  });

  let branch = GetTable.outData;

  let today = new Date();
  context.row.datadoc.customForm.branch = branch;
  context.row.datadoc.customForm.today = today;

  context.row.datadoc.branch = branch;
  context.row.datadoc.today = today;
  context.row.datadoc.validity = "30 days";
  context.row.datadoc.insuredTypedoc = "Corporate";

  let sellerName = "Direct Bussiness";

  if (
    context.row.datadoc.sellerId > 0 ||
    context.row.datadoc.sellerId != null
  ) {
    await doCmd({
      cmd: "GetContacts",
      data: { filter: "id=" + context.row.datadoc.sellerId },
    });
    let sellerName = GetContacts.outData[0].FullName;
  }

  context.row.datadoc.sellerName = sellerName;

  /*Additional Fields on Custom Form*/
  let copaymentId = parseFloat(
    context.row.jsonValuesParse.filter((x) => x.name == "copayment")[0].userData
  );
  //add those copayment values on printables
  let copayment;
  switch (copaymentId) {
    case 0:
      copayment = "null";
      break;
    case 5:
      copayment = "5% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
      break;
    case 10:
      copayment = "10% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
      break;
    case 11:
      copayment = "10% COPAY ON ALL ADMISIBLE SERVICES";
      break;
    case 15:
      copayment = "15% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
      break;
    case 20:
      copayment = "20% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
      break;
    case 25:
      copayment = "25% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
      break;
  }

  context.row.datadoc.customForm.copayment = copayment;

  let serviceProviderId = context.row.jsonValuesParse.filter(
    (x) => x.name == "territory"
  )[0].userData;
  let serviceProvider = context.row.jsonValuesParse
    .filter((x) => x.name == "territory")[0]
    .values.filter((t) => t.value == serviceProviderId)[0].label;

  context.row.datadoc.customForm.serviceProviderSelect = serviceProvider;
  context.row.datadoc.customForm.territorial = serviceProvider;

  let channelId = context.row.jsonValuesParse.filter(
    (x) => x.name == "channel"
  )[0].userData;
  let channel = context.row.jsonValuesParse
    .filter((x) => x.name == "channel")[0]
    .values.filter((t) => t.value == channelId)[0].label;

  context.row.datadoc.customForm.channel = channel;

  let optionQuotePlan = context.row.jsonValuesParse.filter(
    (x) => x.name == "quotePlan"
  )[0].userData[0];
  let quotePlan = context.row.jsonValuesParse
    .filter((x) => x.name == "quotePlan")[0]
    .values.filter((a) => a.value == optionQuotePlan)[0].label;
  context.row.datadoc.customForm.quotePlan = quotePlan;

  /*let datadocFullInsurance = [];
    let datadocFund = [];*/

  if (quotePlan == "Full Insurance") {
    datadocFullInsurance = context.row.datadoc.customForm;
  } else {
    datadocFund = context.row.datadoc.customForm;
    datadocFund.currency = context.row.datadoc.currency;
    context.row.datadoc.customForm.Fund = {
      currency: context.row.datadoc.currency,
      estimatedFundSize: context.row.datadoc.customForm.estimatedFundSize,
      fundAdminFee: context.row.datadoc.customForm.fundAdminFee,
      vat: context.row.datadoc.customForm.vat,
      totalFundAmount: context.row.datadoc.customForm.totalFundAmount,
      formTotalPremium: context.row.datadoc.customForm.formTotalPremium,
    };
  }
  context.row.datadoc.totalPremiumAllObjects =
    context.row.datadoc.customForm.formTotalPremium;
  /*context.row.datadoc.customForm.Full = datadocFullInsurance;
context.row.datadoc.customForm.Fund = datadocFund;*/

  // CONDITIONAL STRUCTURE FOR SECOND QUOTATION OBJECT
  if (
    context.row.datadoc.InsuredObjects.filter((x) => x.objectDefinitionId == 5)
      .length == 0
  ) {
    //do nothing
  } else {
    context.row.jsonValuesParse2 = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    );

    context.row.jsonValuesParse2;

    context.row.datadoc.customForm2 = { test: "test" };
    context.row.datadoc.customForm2.Holder = context.row.datadoc.Holder;
    context.row.datadoc.customForm2.currency = context.row.datadoc.currency;

    let staffNumber =
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m10")[0]
          .userData[0]
      );

    context.row.datadoc.customForm2.staffNumber = staffNumber;

    let dependantNumber =
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) *
        2 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) *
        3 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) *
        4 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) *
        5 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) *
        6 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) *
        7 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) *
        8 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) *
        9 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) *
        10 +
      parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "m10")[0]
          .userData[0]
      ) *
        11 -
      staffNumber;

    context.row.datadoc.customForm2.dependantNumber = dependantNumber;

    context.row.datadoc.customForm2.planName = planName;

    let inpatientScope = context.row.jsonValuesParse2.filter(
      (x) => x.name == "inpatientScope"
    )[0].userData;
    context.row.datadoc.customForm2.inpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "inpatientScope")[0]
      .values.filter((t) => t.value == inpatientScope)[0].label;

    let ipLimit = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "inpatient")[0]
        .userData
    );
    let ip1Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse2.filter(
            (x) => x.name == "subCongenital"
          )[0].userData[0]
        )) /
        100
    );
    let ip2Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse2.filter(
            (x) => x.name == "subOphtalmologic"
          )[0].userData[0]
        )) /
        100
    );
    let ip3Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse2.filter((x) => x.name == "subDental")[0]
            .userData[0]
        )) /
        100
    );

    context.row.datadoc.customForm2.ipLimit = ipLimit;
    context.row.datadoc.customForm2.ip1Limit = ip1Limit;
    context.row.datadoc.customForm2.ip2Limit = ip2Limit;
    context.row.datadoc.customForm2.ip3Limit = ip3Limit;

    let opLimit = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "outpatient")[0]
        .userData
    );
    context.row.datadoc.customForm2.opLimit = opLimit;

    let outpatientScope = context.row.jsonValuesParse2.filter(
      (x) => x.name == "outpatientScope"
    )[0].userData;
    context.row.datadoc.customForm2.outpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "outpatientScope")[0]
      .values.filter((t) => t.value == outpatientScope)[0].label;

    let gradientChecked = context.row.jsonValuesParse2.filter(
      (x) => x.name == "gradientCheck"
    )[0].userData;

    context.row.datadoc.customForm2.hasOutPatientGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "1") != null;
    context.row.datadoc.customForm2.hasDentalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "2") != null;
    context.row.datadoc.customForm2.hasOpticalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "3") != null;
    context.row.datadoc.customForm2.outpatientScopeGradient = "";
    context.row.datadoc.customForm2.opLimitGradient = "";
    context.row.datadoc.customForm2.opMemberGradient = "";
    context.row.datadoc.customForm2.dentalScopeGradient = "";
    context.row.datadoc.customForm2.dentalLimitGradient = "";
    context.row.datadoc.customForm2.dentalMemberGradient = "";
    context.row.datadoc.customForm2.opticalScopeGradient = "";
    context.row.datadoc.customForm2.opticalLimitGradient = "";
    context.row.datadoc.customForm2.opticalMemberGradient = "";

    if (context.row.datadoc.customForm2.hasOutPatientGradient) {
      let outpatientScopeG = context.row.jsonValuesParse2.filter(
        (x) => x.name == "outpatientScopeG"
      )[0].userData;
      let opLimitG = parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "outpatientG")[0]
          .userData
      );
      context.row.datadoc.customForm2.outpatientScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].jValues
      )
        .filter((x) => x.name == "outpatientScopeG")[0]
        .values.filter((t) => t.value == outpatientScopeG)[0].label;
      context.row.datadoc.customForm2.opLimitGradient = opLimitG;
      context.row.datadoc.customForm2.opMemberGradient =
        context.row.jsonValuesParse2.filter(
          (x) => x.name == "outpatientGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm2.hasDentalGradient) {
      let dentalScopeG = context.row.jsonValuesParse2.filter(
        (x) => x.name == "dentalScopeG"
      )[0].userData;
      let dentalLimitG = parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "dentalG")[0]
          .userData
      );
      context.row.datadoc.customForm2.dentalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].jValues
      )
        .filter((x) => x.name == "dentalScopeG")[0]
        .values.filter((t) => t.value == dentalScopeG)[0].label;
      context.row.datadoc.customForm2.dentalLimitGradient = dentalLimitG;
      context.row.datadoc.customForm2.dentalMemberGradient =
        context.row.jsonValuesParse2.filter(
          (x) => x.name == "dentalGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm2.hasOpticalGradient) {
      let opticalScopeG = context.row.jsonValuesParse2.filter(
        (x) => x.name == "opticalScopeG"
      )[0].userData;
      let opticalLimitG = parseFloat(
        context.row.jsonValuesParse2.filter((x) => x.name == "opticalG")[0]
          .userData
      );
      context.row.datadoc.customForm2.opticalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].jValues
      )
        .filter((x) => x.name == "opticalScopeG")[0]
        .values.filter((t) => t.value == opticalScopeG)[0].label;
      context.row.datadoc.customForm2.opticalLimitGradient = opticalLimitG;
      context.row.datadoc.customForm2.opticalMemberGradient =
        context.row.jsonValuesParse2.filter(
          (x) => x.name == "opticalGradient"
        )[0].userData;
    }

    let matLimit = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "maternity")[0]
        .userData
    );
    context.row.datadoc.customForm2.matLimit = matLimit;

    let maternityScope = context.row.jsonValuesParse2
      .filter((x) => x.name == "maternityScope")[0]
      .values.filter((v) => v.selected == true)[0].label;
    context.row.datadoc.customForm2.maternityScope = maternityScope;

    let dentalLimit = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "dental")[0].userData
    );
    context.row.datadoc.customForm2.dentalLimit = dentalLimit;

    let dentalScope = context.row.jsonValuesParse2.filter(
      (x) => x.name == "dentalScope"
    )[0].userData;
    context.row.datadoc.customForm2.dentalScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "dentalScope")[0]
      .values.filter((t) => t.value == dentalScope)[0].label;

    let opticalLimit = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "optical")[0]
        .userData
    );
    context.row.datadoc.customForm2.opticalLimit = opticalLimit;

    let opticalScope = context.row.jsonValuesParse2.filter(
      (x) => x.name == "opticalScope"
    )[0].userData;
    context.row.datadoc.customForm2.opticalScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "opticalScope")[0]
      .values.filter((t) => t.value == opticalScope)[0].label;

    await doCmd({
      cmd: "GetTableRows",
      data: {
        table: "MedicalCorporateFUNERALTariff",
        column: " TIPO TARIFICACION ",
        filterValue: " TF ",
        getColumn1: " TIPO TARIFICACION ",
        getColumn2: ipLimit,
      },
    });
    let lastExpenseLimit = parseFloat(GetTableRows.outData[0].column2);
    context.row.datadoc.customForm2.lastExpenseLimit = lastExpenseLimit;

    /*Get Fields to print on Full Insurance Quotations*/
    context.row.datadoc.customForm2.totalBasePremium = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.totalBasePremium
      )
    );

    context.row.datadoc.customForm2.mds = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.mds
      )
    );

    context.row.datadoc.customForm2.adminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.adminFee
      )
    );

    context.row.datadoc.customForm2.totalInsuranceSide = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.totalInsuranceSide
      )
    );

    /*Get Fields to print on Fund Management Quotations*/
    context.row.datadoc.customForm2.estimatedFundSize = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.totalBaseInsuranceSide
      )
    );

    context.row.datadoc.customForm2.fundAdminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.fundFee
      )
    );

    context.row.datadoc.customForm2.vat = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.vat
      )
    );

    context.row.datadoc.customForm2.totalFundAmount = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 5
        )[0].userData.totalFundAmount
      )
    );

    /*Get Total Amount*/
    context.row.datadoc.customForm2.formTotalPremium =
      context.row.datadoc.customForm2.totalInsuranceSide +
      context.row.datadoc.customForm2.totalFundAmount;

    let today = new Date();
    context.row.datadoc.customForm2.today = today;

    /*Additional Fields on Custom Form*/
    let copaymentId = parseFloat(
      context.row.jsonValuesParse2.filter((x) => x.name == "copayment")[0]
        .userData
    );
    let copayment = "null";
    switch (copaymentId) {
      case 0:
        copayment = "null";
        break;
      case 5:
        copayment = "5% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 10:
        copayment =
          "10% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 15:
        copayment =
          "15% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 20:
        copayment =
          "20% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 25:
        copayment =
          "25% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
    }

    context.row.datadoc.customForm2.copayment = copayment;

    let serviceProviderId = context.row.jsonValuesParse2.filter(
      (x) => x.name == "territory"
    )[0].userData;
    let serviceProvider = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "territory")[0]
      .values.filter((t) => t.value == serviceProviderId)[0].label;

    context.row.datadoc.customForm2.serviceProviderSelect = serviceProvider;
    context.row.datadoc.customForm2.territorial = serviceProvider;

    let channelId = context.row.jsonValuesParse2.filter(
      (x) => x.name == "channel"
    )[0].userData;
    let channel = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 5
      )[0].jValues
    )
      .filter((x) => x.name == "channel")[0]
      .values.filter((t) => t.value == channelId)[0].label;

    context.row.datadoc.customForm2.channel = channel;

    let optionQuotePlan = context.row.jsonValuesParse2.filter(
      (x) => x.name == "quotePlan"
    )[0].userData[0];
    let quotePlan = context.row.jsonValuesParse2
      .filter((x) => x.name == "quotePlan")[0]
      .values.filter((a) => a.value == optionQuotePlan)[0].label;
    context.row.datadoc.customForm.quotePlan = quotePlan;

    /*let datadocFullInsurance = [];
    let datadocFund = [];*/

    if (quotePlan == "Full Insurance") {
      datadocFullInsurance = context.row.datadoc.customForm2;
    } else {
      datadocFund = context.row.datadoc.customForm2;
      datadocFund.currency = context.row.datadoc.currency;
      context.row.datadoc.customForm2.Fund = {
        currency: context.row.datadoc.currency,
        estimatedFundSize: context.row.datadoc.customForm2.estimatedFundSize,
        fundAdminFee: context.row.datadoc.customForm2.fundAdminFee,
        vat: context.row.datadoc.customForm2.vat,
        totalFundAmount: context.row.datadoc.customForm2.totalFundAmount,
        formTotalPremium: context.row.datadoc.customForm2.formTotalPremium,
      };
    }
    context.row.datadoc.totalPremiumAllObjects +=
      context.row.datadoc.customForm2.formTotalPremium;
    /*context.row.datadoc.customForm2.Full = datadocFullInsurance;
    context.row.datadoc.customForm2.Fund = datadocFund;*/
  } // END OF IF ELSE FOR SECOND QUOTATION OBJECT

  // CONDITIONAL STRUCTURE FOR THIRD QUOTATION OBJECT
  if (
    context.row.datadoc.InsuredObjects.filter((x) => x.objectDefinitionId == 6)
      .length == 0
  ) {
    //do nothing
    context.row.datadoc.form3 = false;
  } else {
    context.row.datadoc.form3 = true;
    context.row.jsonValuesParse3 = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 6
      )[0].jValues
    );

    context.row.jsonValuesParse3;

    context.row.datadoc.customForm3 = { test: "test" };
    context.row.datadoc.customForm3.Holder = context.row.datadoc.Holder;
    context.row.datadoc.customForm3.currency = context.row.datadoc.currency;

    let staffNumber =
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m10")[0]
          .userData[0]
      );

    context.row.datadoc.customForm3.staffNumber = staffNumber;

    let dependantNumber =
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) *
        2 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) *
        3 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) *
        4 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) *
        5 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) *
        6 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) *
        7 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) *
        8 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) *
        9 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) *
        10 +
      parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "m10")[0]
          .userData[0]
      ) *
        11 -
      staffNumber;

    context.row.datadoc.customForm3.dependantNumber = dependantNumber;

    context.row.datadoc.customForm3.planName = planName;

    let inpatientScope = context.row.jsonValuesParse3.filter(
      (x) => x.name == "inpatientScope"
    )[0].userData;
    context.row.datadoc.customForm3.inpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 6
      )[0].jValues
    )
      .filter((x) => x.name == "inpatientScope")[0]
      .values.filter((t) => t.value == inpatientScope)[0].label;

    let ipLimit = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "inpatient")[0]
        .userData
    );
    let ip1Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse3.filter(
            (x) => x.name == "subCongenital"
          )[0].userData[0]
        )) /
        100
    );
    let ip2Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse3.filter(
            (x) => x.name == "subOphtalmologic"
          )[0].userData[0]
        )) /
        100
    );
    let ip3Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse3.filter((x) => x.name == "subDental")[0]
            .userData[0]
        )) /
        100
    );

    context.row.datadoc.customForm3.ipLimit = ipLimit;
    context.row.datadoc.customForm3.ip1Limit = ip1Limit;
    context.row.datadoc.customForm3.ip2Limit = ip2Limit;
    context.row.datadoc.customForm3.ip3Limit = ip3Limit;

    let gradientChecked = context.row.jsonValuesParse3.filter(
      (x) => x.name == "gradientCheck"
    )[0].userData;

    context.row.datadoc.customForm3.hasOutPatientGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "1") != null;
    context.row.datadoc.customForm3.hasDentalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "2") != null;
    context.row.datadoc.customForm3.hasOpticalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "3") != null;
    context.row.datadoc.customForm3.outpatientScopeGradient = "";
    context.row.datadoc.customForm3.opLimitGradient = "";
    context.row.datadoc.customForm3.opMemberGradient = "";
    context.row.datadoc.customForm3.dentalScopeGradient = "";
    context.row.datadoc.customForm3.dentalLimitGradient = "";
    context.row.datadoc.customForm3.dentalMemberGradient = "";
    context.row.datadoc.customForm3.opticalScopeGradient = "";
    context.row.datadoc.customForm3.opticalLimitGradient = "";
    context.row.datadoc.customForm3.opticalMemberGradient = "";

    if (context.row.datadoc.customForm3.hasOutPatientGradient) {
      let outpatientScopeG = context.row.jsonValuesParse3.filter(
        (x) => x.name == "outpatientScopeG"
      )[0].userData;
      let opLimitG = parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "outpatientG")[0]
          .userData
      );
      context.row.datadoc.customForm3.outpatientScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].jValues
      )
        .filter((x) => x.name == "outpatientScopeG")[0]
        .values.filter((t) => t.value == outpatientScopeG)[0].label;
      context.row.datadoc.customForm3.opLimitGradient = opLimitG;
      context.row.datadoc.customForm3.opMemberGradient =
        context.row.jsonValuesParse3.filter(
          (x) => x.name == "outpatientGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm3.hasDentalGradient) {
      let dentalScopeG = context.row.jsonValuesParse3.filter(
        (x) => x.name == "dentalScopeG"
      )[0].userData;
      let dentalLimitG = parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "dentalG")[0]
          .userData
      );
      context.row.datadoc.customForm3.dentalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].jValues
      )
        .filter((x) => x.name == "dentalScopeG")[0]
        .values.filter((t) => t.value == dentalScopeG)[0].label;
      context.row.datadoc.customForm3.dentalLimitGradient = dentalLimitG;
      context.row.datadoc.customForm3.dentalMemberGradient =
        context.row.jsonValuesParse3.filter(
          (x) => x.name == "dentalGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm3.hasOpticalGradient) {
      let opticalScopeG = context.row.jsonValuesParse3.filter(
        (x) => x.name == "opticalScopeG"
      )[0].userData;
      let opticalLimitG = parseFloat(
        context.row.jsonValuesParse3.filter((x) => x.name == "opticalG")[0]
          .userData
      );
      context.row.datadoc.customForm3.opticalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].jValues
      )
        .filter((x) => x.name == "opticalScopeG")[0]
        .values.filter((t) => t.value == opticalScopeG)[0].label;
      context.row.datadoc.customForm3.opticalLimitGradient = opticalLimitG;
      context.row.datadoc.customForm3.opticalMemberGradient =
        context.row.jsonValuesParse3.filter(
          (x) => x.name == "opticalGradient"
        )[0].userData;
    }

    let opLimit = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "outpatient")[0]
        .userData
    );
    context.row.datadoc.customForm3.opLimit = opLimit;

    let outpatientScope = context.row.jsonValuesParse3.filter(
      (x) => x.name == "outpatientScope"
    )[0].userData;
    
    // context.row.datadoc.customForm3.outpatientScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 6
    //   )[0].jValues
    // ).filter((x) => x.name == "outpatientScope")[0]
    //   .values.filter((t) => t.value == outpatientScope)[0].label;

    let matLimit = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "maternity")[0]
        .userData
    );
    context.row.datadoc.customForm3.matLimit = matLimit;

    let maternityScope = context.row.jsonValuesParse3
      .filter((x) => x.name == "maternityScope")[0]
      .values.filter((v) => v.selected == true)[0].label;
    context.row.datadoc.customForm3.maternityScope = maternityScope;

    let dentalLimit = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "dental")[0].userData
    );
    context.row.datadoc.customForm3.dentalLimit = dentalLimit;

    let dentalScope = context.row.jsonValuesParse3.filter(
      (x) => x.name == "dentalScope"
    )[0].userData;

    // context.row.datadoc.customForm3.dentalScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 6
    //   )[0].jValues
    // )
    //   .filter((x) => x.name == "dentalScope")[0]
    //   .values.filter((t) => t.value == dentalScope)[0].label;

    let opticalLimit = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "optical")[0]
        .userData
    );
    context.row.datadoc.customForm3.opticalLimit = opticalLimit;

    // let opticalScope = context.row.jsonValuesParse3.filter(
    //   (x) => x.name == "opticalScope"
    // )[0].userData;
    // context.row.datadoc.customForm3.opticalScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 6
    //   )[0].jValues
    // )
    //   .filter((x) => x.name == "opticalScope")[0]
    //   .values.filter((t) => t.value == opticalScope)[0].label;

    await doCmd({
      cmd: "GetTableRows",
      data: {
        table: "MedicalCorporateFUNERALTariff",
        column: " TIPO TARIFICACION ",
        filterValue: " TF ",
        getColumn1: " TIPO TARIFICACION ",
        getColumn2: ipLimit,
      },
    });
    let lastExpenseLimit = parseFloat(GetTableRows.outData[0].column2);
    context.row.datadoc.customForm3.lastExpenseLimit = lastExpenseLimit;

    /*Get Fields to print on Full Insurance Quotations*/
    context.row.datadoc.customForm3.totalBasePremium = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.totalBasePremium
      )
    );

    context.row.datadoc.customForm3.mds = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.mds
      )
    );

    context.row.datadoc.customForm3.adminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.adminFee
      )
    );

    context.row.datadoc.customForm3.totalInsuranceSide = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.totalInsuranceSide
      )
    );

    /*Get Fields to print on Fund Management Quotations*/
    context.row.datadoc.customForm3.estimatedFundSize = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.totalBaseInsuranceSide
      )
    );

    context.row.datadoc.customForm3.fundAdminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.fundFee
      )
    );

    context.row.datadoc.customForm3.vat = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.vat
      )
    );

    context.row.datadoc.customForm3.totalFundAmount = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 6
        )[0].userData.totalFundAmount
      )
    );

    /*Get Total Amount*/
    context.row.datadoc.customForm3.formTotalPremium =
      context.row.datadoc.customForm3.totalInsuranceSide +
      context.row.datadoc.customForm3.totalFundAmount;

    let today = new Date();
    context.row.datadoc.customForm3.today = today;

    /*Additional Fields on Custom Form*/
    let copaymentId = parseFloat(
      context.row.jsonValuesParse3.filter((x) => x.name == "copayment")[0]
        .userData
    );
    let copayment = "null";
    switch (copaymentId) {
      case 0:
        copayment = "null";
        break;
      case 5:
        copayment = "5% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 10:
        copayment =
          "10% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 15:
        copayment =
          "15% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 20:
        copayment =
          "20% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 25:
        copayment =
          "25% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
    }

    context.row.datadoc.customForm3.copayment = copayment;

    let serviceProviderId = context.row.jsonValuesParse3.filter(
      (x) => x.name == "territory"
    )[0].userData;
    let serviceProvider = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 6
      )[0].jValues
    )
      .filter((x) => x.name == "territory")[0]
      .values.filter((t) => t.value == serviceProviderId)[0].label;

    context.row.datadoc.customForm3.serviceProviderSelect = serviceProvider;
    context.row.datadoc.customForm3.territorial = serviceProvider;

    let channelId = context.row.jsonValuesParse3.filter(
      (x) => x.name == "channel"
    )[0].userData;
    let channel = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 6
      )[0].jValues
    )
      .filter((x) => x.name == "channel")[0]
      .values.filter((t) => t.value == channelId)[0].label;

    context.row.datadoc.customForm3.channel = channel;

    let optionQuotePlan = context.row.jsonValuesParse3.filter(
      (x) => x.name == "quotePlan"
    )[0].userData[0];
    let quotePlan = context.row.jsonValuesParse3
      .filter((x) => x.name == "quotePlan")[0]
      .values.filter((a) => a.value == optionQuotePlan)[0].label;
    context.row.datadoc.customForm3.quotePlan = quotePlan;

    /*let datadocFullInsurance = [];
    let datadocFund = [];*/

    if (quotePlan == "Full Insurance") {
      datadocFullInsurance = context.row.datadoc.customForm3;
    } else {
      datadocFund = context.row.datadoc.customForm3;
      datadocFund.currency = context.row.datadoc.currency;
      context.row.datadoc.customForm3.Fund = {
        currency: context.row.datadoc.currency,
        estimatedFundSize: context.row.datadoc.customForm3.estimatedFundSize,
        fundAdminFee: context.row.datadoc.customForm3.fundAdminFee,
        vat: context.row.datadoc.customForm3.vat,
        totalFundAmount: context.row.datadoc.customForm3.totalFundAmount,
        formTotalPremium: context.row.datadoc.customForm3.formTotalPremium,
      };
    }
    context.row.datadoc.totalPremiumAllObjects +=
      context.row.datadoc.customForm3.formTotalPremium;
    /*context.row.datadoc.customForm3.Full = datadocFullInsurance;
    context.row.datadoc.customForm3.Fund = datadocFund;*/
  } // END OF IF ELSE FOR THIRD QUOTATION OBJECT

  // CONDITIONAL STRUCTURE FOR FOURTH QUOTATION OBJECT
  if (
    context.row.datadoc.InsuredObjects.filter((x) => x.objectDefinitionId == 9)
      .length == 0
  ) {
    //do nothing
    context.row.datadoc.form4 = false;
  } else {
    context.row.datadoc.form4 = true;
    context.row.jsonValuesParse4 = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 9
      )[0].jValues
    );

    context.row.jsonValuesParse4;

    context.row.datadoc.customForm4 = { test: "test" };
    context.row.datadoc.customForm4.Holder = context.row.datadoc.Holder;
    context.row.datadoc.customForm4.currency = context.row.datadoc.currency;

    let staffNumber =
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m10")[0]
          .userData[0]
      );

    context.row.datadoc.customForm4.staffNumber = staffNumber;

    let dependantNumber =
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) *
        2 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) *
        3 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) *
        4 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) *
        5 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) *
        6 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) *
        7 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) *
        8 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) *
        9 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) *
        10 +
      parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "m10")[0]
          .userData[0]
      ) *
        11 -
      staffNumber;

    context.row.datadoc.customForm4.dependantNumber = dependantNumber;

    context.row.datadoc.customForm4.planName = planName;

    let inpatientScope = context.row.jsonValuesParse4.filter(
      (x) => x.name == "inpatientScope"
    )[0].userData;
    // context.row.datadoc.customForm4.inpatientScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 9
    //   )[0].jValues
    // )
    //   .filter((x) => x.name == "inpatientScope")[0]
    //   .values.filter((t) => t.value == inpatientScope)[0].label;

    let ipLimit = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "inpatient")[0]
        .userData
    );
    let ip1Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse4.filter(
            (x) => x.name == "subCongenital"
          )[0].userData[0]
        )) /
        100
    );
    let ip2Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse4.filter(
            (x) => x.name == "subOphtalmologic"
          )[0].userData[0]
        )) /
        100
    );
    let ip3Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse4.filter((x) => x.name == "subDental")[0]
            .userData[0]
        )) /
        100
    );

    context.row.datadoc.customForm4.ipLimit = ipLimit;
    context.row.datadoc.customForm4.ip1Limit = ip1Limit;
    context.row.datadoc.customForm4.ip2Limit = ip2Limit;
    context.row.datadoc.customForm4.ip3Limit = ip3Limit;

    let gradientChecked = context.row.jsonValuesParse4.filter(
      (x) => x.name == "gradientCheck"
    )[0].userData;

    context.row.datadoc.customForm4.hasOutPatientGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "1") != null;
    context.row.datadoc.customForm4.hasDentalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "2") != null;
    context.row.datadoc.customForm4.hasOpticalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "3") != null;
    context.row.datadoc.customForm4.outpatientScopeGradient = "";
    context.row.datadoc.customForm4.opLimitGradient = "";
    context.row.datadoc.customForm4.opMemberGradient = "";
    context.row.datadoc.customForm4.dentalScopeGradient = "";
    context.row.datadoc.customForm4.dentalLimitGradient = "";
    context.row.datadoc.customForm4.dentalMemberGradient = "";
    context.row.datadoc.customForm4.opticalScopeGradient = "";
    context.row.datadoc.customForm4.opticalLimitGradient = "";
    context.row.datadoc.customForm4.opticalMemberGradient = "";

    if (context.row.datadoc.customForm4.hasOutPatientGradient) {
      let outpatientScopeG = context.row.jsonValuesParse4.filter(
        (x) => x.name == "outpatientScopeG"
      )[0].userData;
      let opLimitG = parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "outpatientG")[0]
          .userData
      );
      context.row.datadoc.customForm4.outpatientScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].jValues
      )
        .filter((x) => x.name == "outpatientScopeG")[0]
        .values.filter((t) => t.value == outpatientScopeG)[0].label;
      context.row.datadoc.customForm4.opLimitGradient = opLimitG;
      context.row.datadoc.customForm4.opMemberGradient =
        context.row.jsonValuesParse4.filter(
          (x) => x.name == "outpatientGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm4.hasDentalGradient) {
      let dentalScopeG = context.row.jsonValuesParse4.filter(
        (x) => x.name == "dentalScopeG"
      )[0].userData;
      let dentalLimitG = parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "dentalG")[0]
          .userData
      );
      context.row.datadoc.customForm4.dentalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].jValues
      )
        .filter((x) => x.name == "dentalScopeG")[0]
        .values.filter((t) => t.value == dentalScopeG)[0].label;
      context.row.datadoc.customForm4.dentalLimitGradient = dentalLimitG;
      context.row.datadoc.customForm4.dentalMemberGradient =
        context.row.jsonValuesParse4.filter(
          (x) => x.name == "dentalGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm4.hasOpticalGradient) {
      let opticalScopeG = context.row.jsonValuesParse4.filter(
        (x) => x.name == "opticalScopeG"
      )[0].userData;
      let opticalLimitG = parseFloat(
        context.row.jsonValuesParse4.filter((x) => x.name == "opticalG")[0]
          .userData
      );
      context.row.datadoc.customForm4.opticalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].jValues
      )
        .filter((x) => x.name == "opticalScopeG")[0]
        .values.filter((t) => t.value == opticalScopeG)[0].label;
      context.row.datadoc.customForm4.opticalLimitGradient = opticalLimitG;
      context.row.datadoc.customForm4.opticalMemberGradient =
        context.row.jsonValuesParse4.filter(
          (x) => x.name == "opticalGradient"
        )[0].userData;
    }

    let opLimit = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "outpatient")[0]
        .userData
    );
    context.row.datadoc.customForm4.opLimit = opLimit;

    let outpatientScope = context.row.jsonValuesParse4.filter(
      (x) => x.name == "outpatientScope"
    )[0].userData;
    context.row.datadoc.customForm4.outpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 9
      )[0].jValues
    )
      .filter((x) => x.name == "outpatientScope")[0]
      .values.filter((t) => t.value == outpatientScope)[0].label;

    let matLimit = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "maternity")[0]
        .userData
    );
    context.row.datadoc.customForm4.matLimit = matLimit;

    let maternityScope = context.row.jsonValuesParse4
      .filter((x) => x.name == "maternityScope")[0]
      .values.filter((v) => v.selected == true)[0].label;
    context.row.datadoc.customForm4.maternityScope = maternityScope;

    let dentalLimit = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "dental")[0].userData
    );
    context.row.datadoc.customForm4.dentalLimit = dentalLimit;

    let dentalScope = context.row.jsonValuesParse4.filter(
      (x) => x.name == "dentalScope"
    )[0].userData;
    context.row.datadoc.customForm4.dentalScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 9
      )[0].jValues
    )
      .filter((x) => x.name == "dentalScope")[0]
      .values.filter((t) => t.value == dentalScope)[0].label;

    let opticalLimit = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "optical")[0]
        .userData
    );
    context.row.datadoc.customForm4.opticalLimit = opticalLimit;

    // let opticalScope = context.row.jsonValuesParse4.filter(
    //   (x) => x.name == "opticalScope"
    // )[0].userData;
    // context.row.datadoc.customForm4.opticalScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 9
    //   )[0].jValues
    // )
    //   .filter((x) => x.name == "opticalScope")[0]
    //   .values.filter((t) => t.value == opticalScope)[0].label;

    await doCmd({
      cmd: "GetTableRows",
      data: {
        table: "MedicalCorporateFUNERALTariff",
        column: " TIPO TARIFICACION ",
        filterValue: " TF ",
        getColumn1: " TIPO TARIFICACION ",
        getColumn2: ipLimit,
      },
    });
    let lastExpenseLimit = parseFloat(GetTableRows.outData[0].column2);
    context.row.datadoc.customForm4.lastExpenseLimit = lastExpenseLimit;

    /*Get Fields to print on Full Insurance Quotations*/
    context.row.datadoc.customForm4.totalBasePremium = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.totalBasePremium
      )
    );

    context.row.datadoc.customForm4.mds = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.mds
      )
    );

    context.row.datadoc.customForm4.adminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.adminFee
      )
    );

    context.row.datadoc.customForm4.totalInsuranceSide = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.totalInsuranceSide
      )
    );

    /*Get Fields to print on Fund Management Quotations*/
    context.row.datadoc.customForm4.estimatedFundSize = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.totalBaseInsuranceSide
      )
    );

    context.row.datadoc.customForm4.fundAdminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.fundFee
      )
    );

    context.row.datadoc.customForm4.vat = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.vat
      )
    );

    context.row.datadoc.customForm4.totalFundAmount = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 9
        )[0].userData.totalFundAmount
      )
    );

    /*Get Total Amount*/
    context.row.datadoc.customForm4.formTotalPremium =
      context.row.datadoc.customForm4.totalInsuranceSide +
      context.row.datadoc.customForm4.totalFundAmount;

    let today = new Date();
    context.row.datadoc.customForm4.today = today;

    /*Additional Fields on Custom Form*/
    let copaymentId = parseFloat(
      context.row.jsonValuesParse4.filter((x) => x.name == "copayment")[0]
        .userData
    );
    let copayment = "null";
    switch (copaymentId) {
      case 0:
        copayment = "null";
        break;
      case 5:
        copayment = "5% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 10:
        copayment =
          "10% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 15:
        copayment =
          "15% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 20:
        copayment =
          "20% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 25:
        copayment =
          "25% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
    }

    context.row.datadoc.customForm4.copayment = copayment;

    let serviceProviderId = context.row.jsonValuesParse4.filter(
      (x) => x.name == "territory"
    )[0].userData;
    let serviceProvider = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 9
      )[0].jValues
    )
      .filter((x) => x.name == "territory")[0]
      .values.filter((t) => t.value == serviceProviderId)[0].label;

    context.row.datadoc.customForm4.serviceProviderSelect = serviceProvider;
    context.row.datadoc.customForm4.territorial = serviceProvider;

    let channelId = context.row.jsonValuesParse4.filter(
      (x) => x.name == "channel"
    )[0].userData;
    let channel = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 9
      )[0].jValues
    )
      .filter((x) => x.name == "channel")[0]
      .values.filter((t) => t.value == channelId)[0].label;

    context.row.datadoc.customForm4.channel = channel;

    let optionQuotePlan = context.row.jsonValuesParse4.filter(
      (x) => x.name == "quotePlan"
    )[0].userData[0];
    let quotePlan = context.row.jsonValuesParse4
      .filter((x) => x.name == "quotePlan")[0]
      .values.filter((a) => a.value == optionQuotePlan)[0].label;
    context.row.datadoc.customForm4.quotePlan = quotePlan;

    /*let datadocFullInsurance = [];
    let datadocFund = [];*/

    if (quotePlan == "Full Insurance") {
      datadocFullInsurance = context.row.datadoc.customForm4;
    } else {
      datadocFund = context.row.datadoc.customForm4;
      datadocFund.currency = context.row.datadoc.currency;
      context.row.datadoc.customForm4.Fund = {
        currency: context.row.datadoc.currency,
        estimatedFundSize: context.row.datadoc.customForm4.estimatedFundSize,
        fundAdminFee: context.row.datadoc.customForm4.fundAdminFee,
        vat: context.row.datadoc.customForm4.vat,
        totalFundAmount: context.row.datadoc.customForm4.totalFundAmount,
        formTotalPremium: context.row.datadoc.customForm4.formTotalPremium,
      };
    }
    context.row.datadoc.totalPremiumAllObjects +=
      context.row.datadoc.customForm4.formTotalPremium;
    /*context.row.datadoc.customForm4.Full = datadocFullInsurance;
    context.row.datadoc.customForm4.Fund = datadocFund;*/
  } // END OF IF ELSE FOR FOURTH QUOTATION OBJECT

  // CONDITIONAL STRUCTURE FOR FIFTH QUOTATION OBJECT
  if (
    context.row.datadoc.InsuredObjects.filter((x) => x.objectDefinitionId == 10)
      .length == 0
  ) {
    //do nothing
    context.row.datadoc.form5 = false;
  } else {
    context.row.datadoc.form5 = true;
    context.row.jsonValuesParse5 = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    );

    context.row.jsonValuesParse5;

    context.row.datadoc.customForm5 = { test: "test" };
    context.row.datadoc.customForm5.Holder = context.row.datadoc.Holder;
    context.row.datadoc.customForm5.currency = context.row.datadoc.currency;

    let staffNumber =
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m10")[0]
          .userData[0]
      );

    context.row.datadoc.customForm5.staffNumber = staffNumber;

    let dependantNumber =
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m")[0].userData[0]
      ) +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m1")[0]
          .userData[0]
      ) *
        2 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m2")[0]
          .userData[0]
      ) *
        3 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m3")[0]
          .userData[0]
      ) *
        4 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m4")[0]
          .userData[0]
      ) *
        5 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m5")[0]
          .userData[0]
      ) *
        6 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m6")[0]
          .userData[0]
      ) *
        7 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m7")[0]
          .userData[0]
      ) *
        8 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m8")[0]
          .userData[0]
      ) *
        9 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m9")[0]
          .userData[0]
      ) *
        10 +
      parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "m10")[0]
          .userData[0]
      ) *
        11 -
      staffNumber;

    context.row.datadoc.customForm5.dependantNumber = dependantNumber;

    context.row.datadoc.customForm5.planName = planName;

    let inpatientScope = context.row.jsonValuesParse5.filter(
      (x) => x.name == "inpatientScope"
    )[0].userData;
    context.row.datadoc.customForm5.inpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    )
      .filter((x) => x.name == "inpatientScope")[0]
      .values.filter((t) => t.value == inpatientScope)[0].label;

    let ipLimit = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "inpatient")[0]
        .userData
    );
    let ip1Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse5.filter(
            (x) => x.name == "subCongenital"
          )[0].userData[0]
        )) /
        100
    );
    let ip2Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse5.filter(
            (x) => x.name == "subOphtalmologic"
          )[0].userData[0]
        )) /
        100
    );
    let ip3Limit = Math.round(
      (ipLimit *
        parseFloat(
          context.row.jsonValuesParse5.filter((x) => x.name == "subDental")[0]
            .userData[0]
        )) /
        100
    );

    context.row.datadoc.customForm5.ipLimit = ipLimit;
    context.row.datadoc.customForm5.ip1Limit = ip1Limit;
    context.row.datadoc.customForm5.ip2Limit = ip2Limit;
    context.row.datadoc.customForm5.ip3Limit = ip3Limit;

    let gradientChecked = context.row.jsonValuesParse5.filter(
      (x) => x.name == "gradientCheck"
    )[0].userData;

    context.row.datadoc.customForm5.hasOutPatientGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "1") != null;
    context.row.datadoc.customForm5.hasDentalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "2") != null;
    context.row.datadoc.customForm5.hasOpticalGradient =
      gradientChecked != null && gradientChecked.find((x) => x == "3") != null;
    context.row.datadoc.customForm5.outpatientScopeGradient = "";
    context.row.datadoc.customForm5.opLimitGradient = "";
    context.row.datadoc.customForm5.opMemberGradient = "";
    context.row.datadoc.customForm5.dentalScopeGradient = "";
    context.row.datadoc.customForm5.dentalLimitGradient = "";
    context.row.datadoc.customForm5.dentalMemberGradient = "";
    context.row.datadoc.customForm5.opticalScopeGradient = "";
    context.row.datadoc.customForm5.opticalLimitGradient = "";
    context.row.datadoc.customForm5.opticalMemberGradient = "";

    if (context.row.datadoc.customForm5.hasOutPatientGradient) {
      let outpatientScopeG = context.row.jsonValuesParse5.filter(
        (x) => x.name == "outpatientScopeG"
      )[0].userData;
      let opLimitG = parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "outpatientG")[0]
          .userData
      );
      context.row.datadoc.customForm5.outpatientScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].jValues
      )
        .filter((x) => x.name == "outpatientScopeG")[0]
        .values.filter((t) => t.value == outpatientScopeG)[0].label;
      context.row.datadoc.customForm5.opLimitGradient = opLimitG;
      context.row.datadoc.customForm5.opMemberGradient =
        context.row.jsonValuesParse5.filter(
          (x) => x.name == "outpatientGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm5.hasDentalGradient) {
      let dentalScopeG = context.row.jsonValuesParse5.filter(
        (x) => x.name == "dentalScopeG"
      )[0].userData;
      let dentalLimitG = parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "dentalG")[0]
          .userData
      );
      context.row.datadoc.customForm5.dentalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].jValues
      )
        .filter((x) => x.name == "dentalScopeG")[0]
        .values.filter((t) => t.value == dentalScopeG)[0].label;
      context.row.datadoc.customForm5.dentalLimitGradient = dentalLimitG;
      context.row.datadoc.customForm5.dentalMemberGradient =
        context.row.jsonValuesParse5.filter(
          (x) => x.name == "dentalGradient"
        )[0].userData;
    }

    if (context.row.datadoc.customForm5.hasOpticalGradient) {
      let opticalScopeG = context.row.jsonValuesParse5.filter(
        (x) => x.name == "opticalScopeG"
      )[0].userData;
      let opticalLimitG = parseFloat(
        context.row.jsonValuesParse5.filter((x) => x.name == "opticalG")[0]
          .userData
      );
      context.row.datadoc.customForm5.opticalScopeGradient = JSON.parse(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].jValues
      )
        .filter((x) => x.name == "opticalScopeG")[0]
        .values.filter((t) => t.value == opticalScopeG)[0].label;
      context.row.datadoc.customForm5.opticalLimitGradient = opticalLimitG;
      context.row.datadoc.customForm5.opticalMemberGradient =
        context.row.jsonValuesParse5.filter(
          (x) => x.name == "opticalGradient"
        )[0].userData;
    }

    let opLimit = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "outpatient")[0]
        .userData
    );
    context.row.datadoc.customForm5.opLimit = opLimit;

    let outpatientScope = context.row.jsonValuesParse5.filter(
      (x) => x.name == "outpatientScope"
    )[0].userData;
    context.row.datadoc.customForm5.outpatientScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    )
      .filter((x) => x.name == "outpatientScope")[0]
      .values.filter((t) => t.value == outpatientScope)[0].label;

    let matLimit = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "maternity")[0]
        .userData
    );
    context.row.datadoc.customForm5.matLimit = matLimit;

    let maternityScope = context.row.jsonValuesParse5
      .filter((x) => x.name == "maternityScope")[0]
      .values.filter((v) => v.selected == true)[0].label;
    context.row.datadoc.customForm5.maternityScope = maternityScope;

    let dentalLimit = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "dental")[0].userData
    );
    context.row.datadoc.customForm5.dentalLimit = dentalLimit;

    let dentalScope = context.row.jsonValuesParse5.filter(
      (x) => x.name == "dentalScope"
    )[0].userData;
    context.row.datadoc.customForm5.dentalScope = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    )
      .filter((x) => x.name == "dentalScope")[0]
      .values.filter((t) => t.value == dentalScope)[0].label;

    let opticalLimit = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "optical")[0]
        .userData
    );
    context.row.datadoc.customForm5.opticalLimit = opticalLimit;

    let opticalScope = context.row.jsonValuesParse5.filter(
      (x) => x.name == "opticalScope"
    )[0].userData;
    // context.row.datadoc.customForm5.opticalScope = JSON.parse(
    //   context.row.datadoc.InsuredObjects.filter(
    //     (x) => x.objectDefinitionId == 10
    //   )[0].jValues
    // )
    //   .filter((x) => x.name == "opticalScope")[0]
    //   .values.filter((t) => t.value == opticalScope)[0].label;

    await doCmd({
      cmd: "GetTableRows",
      data: {
        table: "MedicalCorporateFUNERALTariff",
        column: " TIPO TARIFICACION ",
        filterValue: " TF ",
        getColumn1: " TIPO TARIFICACION ",
        getColumn2: ipLimit,
      },
    });
    let lastExpenseLimit = parseFloat(GetTableRows.outData[0].column2);
    context.row.datadoc.customForm5.lastExpenseLimit = lastExpenseLimit;

    /*Get Fields to print on Full Insurance Quotations*/
    context.row.datadoc.customForm5.totalBasePremium = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.totalBasePremium
      )
    );

    context.row.datadoc.customForm5.mds = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.mds
      )
    );

    context.row.datadoc.customForm5.adminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.adminFee
      )
    );

    context.row.datadoc.customForm5.totalInsuranceSide = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.totalInsuranceSide
      )
    );

    /*Get Fields to print on Fund Management Quotations*/
    context.row.datadoc.customForm5.estimatedFundSize = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.totalBaseInsuranceSide
      )
    );

    context.row.datadoc.customForm5.fundAdminFee = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.fundFee
      )
    );

    context.row.datadoc.customForm5.vat = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.vat
      )
    );

    context.row.datadoc.customForm5.totalFundAmount = Math.round(
      parseFloat(
        context.row.datadoc.InsuredObjects.filter(
          (x) => x.objectDefinitionId == 10
        )[0].userData.totalFundAmount
      )
    );

    /*Get Total Amount*/
    context.row.datadoc.customForm5.formTotalPremium =
      context.row.datadoc.customForm5.totalInsuranceSide +
      context.row.datadoc.customForm5.totalFundAmount;

    let today = new Date();
    context.row.datadoc.customForm5.today = today;

    /*Additional Fields on Custom Form*/
    let copaymentId = parseFloat(
      context.row.jsonValuesParse5.filter((x) => x.name == "copayment")[0]
        .userData
    );
    let copayment = "";
    switch (copaymentId) {
      case 0:
        copayment = "null";
        break;
      case 5:
        copayment = "5% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 10:
        copayment =
          "10% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 15:
        copayment =
          "15% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 20:
        copayment =
          "20% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
      case 25:
        copayment =
          "25% on Outpatient Services and 100% No.Co-Pay on INPA&MATE";
        break;
    }

    context.row.datadoc.customForm5.copayment = copayment;

    let serviceProviderId = context.row.jsonValuesParse5.filter(
      (x) => x.name == "territory"
    )[0].userData;
    let serviceProvider = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    )
      .filter((x) => x.name == "territory")[0]
      .values.filter((t) => t.value == serviceProviderId)[0].label;

    context.row.datadoc.customForm5.serviceProviderSelect = serviceProvider;
    context.row.datadoc.customForm5.territorial = serviceProvider;

    let channelId = context.row.jsonValuesParse5.filter(
      (x) => x.name == "channel"
    )[0].userData;
    let channel = JSON.parse(
      context.row.datadoc.InsuredObjects.filter(
        (x) => x.objectDefinitionId == 10
      )[0].jValues
    )
      .filter((x) => x.name == "channel")[0]
      .values.filter((t) => t.value == channelId)[0].label;

    context.row.datadoc.customForm5.channel = channel;

    let optionQuotePlan = context.row.jsonValuesParse5.filter(
      (x) => x.name == "quotePlan"
    )[0].userData[0];
    let quotePlan = context.row.jsonValuesParse5
      .filter((x) => x.name == "quotePlan")[0]
      .values.filter((a) => a.value == optionQuotePlan)[0].label;
    context.row.datadoc.customForm5.quotePlan = quotePlan;

    /*let datadocFullInsurance = [];
    let datadocFund = [];*/

    if (quotePlan == "Full Insurance") {
      datadocFullInsurance = context.row.datadoc.customForm5;
    } else {
      datadocFund = context.row.datadoc.customForm5;
      datadocFund.currency = context.row.datadoc.currency;
      context.row.datadoc.customForm5.Fund = {
        currency: context.row.datadoc.currency,
        estimatedFundSize: context.row.datadoc.customForm5.estimatedFundSize,
        fundAdminFee: context.row.datadoc.customForm5.fundAdminFee,
        vat: context.row.datadoc.customForm5.vat,
        totalFundAmount: context.row.datadoc.customForm5.totalFundAmount,
        formTotalPremium: context.row.datadoc.customForm5.formTotalPremium,
      };
    }
    context.row.datadoc.totalPremiumAllObjects +=
      context.row.datadoc.customForm5.formTotalPremium;
    /*context.row.datadoc.customForm5.Full = datadocFullInsurance;
    context.row.datadoc.customForm5.Fund = datadocFund;*/
  } // END OF IF ELSE FOR FIFTH QUOTATION OBJECT

  return context.row.datadoc;

  
};


module.exports = cmdDocument