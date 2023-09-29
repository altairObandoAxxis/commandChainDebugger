const { doCmd } = require("../lib");

module.exports = async function (context) {
  const { id } = context;
  await doCmd({
    cmd: "RepoLifePolicy",
    data: {
      operation: "GET",
      filter: `id=${id}`,
      noTracking: true,
      include: [
        "Insureds",
        "InsuredObjects",
        "Coverages",
        "Coverages.Benefits",
        "Exclusions",
        "Clauses",
      ],
    },
  });
  const [policy] = RepoLifePolicy.outData;
  if (!policy.InsuredObjects || policy.InsuredObjects.length == 0)
    throw "@This document requires MedicalCorporatePricing Insured Object";
  // Category
  const names = ["ONE", "TWO", "TREE", "FOUR", "FIVE", "SIX", "SEVEN"];
  const scopes = { PF: "Per Family", PP: "Per Person" };
  // Build special Items
  //adding clauses by groups added by pacifique Manirakiza
  let policies = policy.Clauses.sort((a, b) =>
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
  context.policy = {
    policies: policies,
    hasClauses: policies.length > 0,
  };
  //adding clauses by groups added by pacifique Manirakiza
  const { staffNumber, dependantNumber } = await GetStaffAndDependants(
    policy.InsuredObjects
  );
  const documentContext = {
    sellerName: await GetSellerName(policy),
    insuredTypedoc: "CORPORATE",
    channel: await GetChannelName({ channelCode: policy.channel }),
    validity: "30 days",
    planName: "IMENA",
    staffNumber,
    dependantNumber,
    today: new Date(),
    branch: await GetBranch(policy.InsuredObjects[0]),
    Categories: await GroupInsuredObjects(policy),
    policies: context.policy.policies, // Include clauses
    hasClauses: context.policy.hasClauses, // Include hasClauses here
  };

  return documentContext;

  async function GetChannelName({ channelCode }) {
    await doCmd({
      cmd: "RepoChannelCatalog",
      data: { operation: "GET", filter: `code='${channelCode}'` },
    });
    return RepoChannelCatalog.outData.pop().name;
  }

  async function GetSellerName({ sellerId }) {
    if (!sellerId) return "Direct Bussiness";
    await doCmd({ cmd: "GetContacts", data: { filter: `id=${sellerId}` } });
    return GetContacts.outData.pop().FullName;
  }

  async function GroupInsuredObjects({ InsuredObjects }) {
    const result = [];
    let index = 0;
    for (const io in InsuredObjects) {
      result.push({
        category: InsuredObjects.length > 1 ? `CATEGORY ${names[index]}` : "",
        territorial: await GetTerritorialLimit(io),
        copayment: await GetCopayment(io),
        serviceProviderSelect: await GetTerritorialLimit(io),
        quotePlan: await GetQuotePlan(io),
        Inpatient: await GetInpatient(io),
        Outpatient: await GetOutpatient(io),
        Maternity: await GetMaternity(io),
        Dental: await GetDental(io),
        Optical: await GetOptical(io),
        lastExpenseLimit: formatCurrency(GetLastExpenseLimit(io)),
        Fund: {
          lastExpenseLimit: formatCurrency(GetLastExpenseLimit(io)),
          totalBasePremium: formatCurrency(io.userData.totalBasePremium),
          mds: formatCurrency(io.userData.mds),
          adminFee: formatCurrency(io.userData.adminFee),
          totalInsuranceSide: formatCurrency(io.userData.totalInsuranceSide),
          estimatedFundSize: formatCurrency(io.userData.totalBaseInsuranceSide),
          fundAdminFee: formatCurrency(io.userData.fundFee),
          vat: formatCurrency(io.userData.vat),
          totalFundAmount: formatCurrency(io.userData.totalFundAmount),
          formTotalPremium: formatCurrency(
            Number(io.userData.totalInsuranceSide) +
              Number(io.userData.totalFundAmount)
          ),
        },
      });
      index++;
    }

    return result;
  }

  async function GetCopayment(insuredObject) {
    const {
      userData: { copayment },
    } = insuredObject;
    if (typeof copayment === "undefined" || copayment == null || copayment == 0)
      return "No copayment selected";
    return [5, 10, 15, 20, 25].includes(Number(copayment))
      ? `${copayment}% on Outpatient Services and 100% No.Co-Pay on INPA&MATE`
      : "10% COPAY ON ALL ADMISIBLE SERVICES";
  }

  async function GetTerritorialLimit(insuredObject) {
    return JSON.parse(insuredObject.jValues)
      .find((item) => item.name == "territory")
      .values.find((item) => item.value == insuredObject.userData.territory)
      .label;
  }

  function formatCurrency(value) {
    return `${policy.currency} ${Number(value || 0).toLocaleString(
      "en-us"
    )}`.replace(".00", "");
  }

  async function GetInpatient({
    userData: {
      inpatientScope,
      InpatientCoverr,
      subCongenital,
      subPreexisting,
      subOphtalmologic,
      subDental,
    },
  }) {
    return {
      scope: scopes[inpatientScope],
      cover: formatCurrency(InpatientCoverr),
      ip1LimitP: formatCurrency(
        (Number(InpatientCoverr) * Number(subPreexisting)) / 100
      ),
      ip1Limit: formatCurrency(
        (Number(InpatientCoverr) * Number(subCongenital)) / 100
      ),
      ip2Limit: formatCurrency(
        (Number(InpatientCoverr) * Number(subOphtalmologic)) / 100
      ),
      ip3Limit: formatCurrency(
        (Number(InpatientCoverr) * Number(subDental)) / 100
      ),
    };
  }

  async function GetOutpatient({
    userData: {
      outpatientScope,
      outpatientCoverr,
      gradientChecked,
      outpatientG,
      outpatientGradient,
      outpatientScopeGradient,
    },
  }) {
    const hasOutPatientGradient = gradientChecked == "1";
    return {
      scope: scopes[outpatientScope],
      cover: formatCurrency(outpatientCoverr),
      hasOutPatientGradient,
      opLimitGradient: formatCurrency(hasOutPatientGradient ? outpatientG : 0),
      outpatientScopeGradient: scopes[outpatientScopeGradient] || "",
      opMemberGradient: outpatientGradient || "",
    };
  }

  async function GetMaternity({
    userData: { maternityScope, maternityCoverr },
  }) {
    return {
      scope: scopes[maternityScope || "PF"] || maternityScope,
      cover: formatCurrency(maternityCoverr),
    };
  }

  async function GetDental({
    userData: {
      dentalScope,
      dentalCoverr,
      gradientChecked,
      dentalScopeG,
      dentalGradient,
      dentalG,
    },
  }) {
    const hasDentalGradient = gradientChecked == "2";
    return {
      scope: scopes[dentalScope],
      cover: formatCurrency(dentalCoverr),
      hasDentalGradient,
      dentalScopeGradient: scopes[dentalScopeG || "PF"],
      dentalLimitGradient: formatCurrency(dentalG),
      dentalMemberGradient: dentalGradient || "",
    };
  }

  async function GetOptical({
    userData: {
      opticalScope,
      gradientChecked,
      opticalG,
      opticalScopeG,
      opticalGradient,
      opticalCoverr,
    },
  }) {
    const hasOpticalGradient = gradientChecked == "3";
    return {
      scope: scopes[opticalScope || "PF"],
      cover: formatCurrency(opticalCoverr),
      hasOpticalGradient,
      opticalScopeGradient: scopes[opticalScopeG || "PF"],
      opticalLimitGradient: formatCurrency(opticalG),
      opticalMemberGradient: Number(opticalGradient || 0),
    };
  }

  async function GetStaffAndDependants(InsuredObjects) {
    const staff = [],
      depend = [];
    InsuredObjects.forEach(({ userData }, catIndex) => {
      const { staffNumber, dependantNumber } = ExtractStaffAndDepends(userData);
      if (staffNumber > 0)
        staff.push(
          InsuredObjects.length > 1
            ? `CAT${catIndex + 1}-${staffNumber}`
            : staffNumber
        );

      if (dependantNumber > 0)
        depend.push(
          InsuredObjects.length > 1
            ? `CAT${catIndex + 1}-${dependantNumber}`
            : dependantNumber
        );
    });
    return {
      staffNumber: staff.join(", "),
      dependantNumber: depend.join(", "),
    };
  }

  function ExtractStaffAndDepends(userData) {
    if (userData.flat == "yes") {
      return {
        staffNumber: Number(userData.staff || 0),
        dependantNumber: Number(userData.dependants || 0),
      };
    }

    let staffNumber = 0,
      dependantNumber = 0;

    for (let index = 0; index <= 10; index++) {
      let key = `m${index == 0 ? "" : index}`;
      staffNumber += Number(userData[key] || 0);
      dependantNumber += Number(userData[key] || 0) * (index + 1);
    }
    // Fix
    if (dependantNumber > 0)
      dependantNumber = Math.max(dependantNumber - staffNumber, 0); // Prevent negative values.

    return { staffNumber, dependantNumber };
  }

  async function GetAdminFee(userData) {
    const { feePerPeson } = userData;
    const { staffNumber, dependantNumber } = ExtractStaffAndDepends(userData);
    return Number(feePerPeson || 0) * (staffNumber + dependantNumber);
  }
  async function GetQuotePlan({ userData: { quotePlan }, jValues }) {
    if (!quotePlan) return "Full Insurance";
    return JSON.parse(jValues)
      .find((item) => item.name == "quotePlan")
      .values.find((item) => item.value == quotePlan).label;
  }

  async function GetLastExpenseLimit(insuredObject) {
    const ipLimit = insuredObject.userData.inpatient;
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
    return GetTableRows.outData[0].column2;
  }

  async function GetBranch({ userData: { branch } }) {
    await doCmd({
      cmd: "GetTable",
      data: {
        table: "PrimeBranchAndFranchiseList",
        column: "S/N",
        row: branch || 1,
        getColumn: "Branch Name",
        notFoundValue: "",
        useCache: false,
      },
    });

    return GetTable.outData;
  }
};
