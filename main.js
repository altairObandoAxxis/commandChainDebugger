const { cmdUploadCertificates } = require('./Prime/cmdUploadCertificates');

const main = async () => {
   const certificates = [
      // {
      //   relationshipName: 'MAIN MEMBER||(A)|',
      //   title: 'MR',
      //   name: 'TWAGIRIMANA ',
      //   middleName: '',
      //   surname1:'VALENS',
      //   birth:'1982-08-13',
      //   gender: 'MALE',
      //   group: 'GROUP 1',
      //   familySize: '',
      //   idTypeName:'NATIONAL ID',
      //   passport:'1198280024350029',
      //   employeeId:'',
      //   groupPolicyId: '11045',
      //   parentHolderId:'',
      // },
      {
        relationshipName: 'CHILD||(C)|',
        title: 'MR',
        name: 'TWAGIRIMANA ',
        middleName: '',
        surname1:'VIVENS',
        birth:'2012-12-10',
        gender: 'MALE',
        group: 'GROUP 1',
        familySize: '',
        idTypeName:'NOT APPLICABLE||(NAP)|',
        passport:'',
        employeeId:'',
        groupPolicyId: '11045',
        parentHolderId:'1198280024350029',
      },
      {
        relationshipName: 'CHILD||(C)|',
        title: 'MR',
        name: 'NDATIMANA',
        middleName: '',
        surname1: 'ROBERT',
        birth: '2018-11-29',
        gender: 'MALE',
        group: 'GROUP 1',
        familySize: '',
        idTypeName:'NOT APPLICABLE||(NAP)|',
        passport:'',
        employeeId:'',
        groupPolicyId:'11045',
        parentHolderId:'1198280024350029'
      },
      {
        relationshipName: 'CHILD||(C)|',
        title: 'MS',
        name: 'UWASE ',
        middleName: '',
        surname1: 'GANZA VALERIE',
        birth: '2014-11-25',
        gender: 'FEMALE',
        group: 'GROUP 1',
        familySize: '',
        idTypeName:'NOT APPLICABLE||(NAP)|',
        passport:'',
        employeeId:'',
        groupPolicyId:'11045',
        parentHolderId:'1198280024350029'
      },
      {
        relationshipName: 'MAIN MEMBER||(A)|',
        title: 'MRS',
        name: 'TUYISABE',
        middleName: '',
        surname1: 'ANGELIQUE',
        birth: '1997-01-01',
        gender: 'FEMALE',
        group: 'GROUP 1',
        familySize: '',
        idTypeName:'NATIONAL ID',
        passport:'1199770235640050',
        employeeId:'',
        groupPolicyId:'11045',
        parentHolderId:''
      },
      {
        relationshipName: 'SPOUSE||(B)|',
        title: 'MR',
        name: 'TUYAMBAZE ',
        middleName: '',
        surname1: 'EMMANUEL',
        birth: '1993-01-01',
        gender: 'MALE',
        group: 'GROUP 1',
        familySize: '',
        idTypeName:'NOT APPLICABLE||(NAP)|',
        passport:'',
        employeeId:'',
        groupPolicyId:'11045',
        parentHolderId:'1199770235640050'
      } 
   ];
for(const item of certificates)
   await cmdUploadCertificates({ row: item });
}

main();