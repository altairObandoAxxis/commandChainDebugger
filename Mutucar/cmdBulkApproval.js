const { doCmd } = require('../lib');
const cmdBulkApproval = async(context)=>{
//block
//noreplace
/**
 * @author Noel Obando
 * @created 2023-10-09
 * @summary This command makes a validation of the selected payments for
 * Make mass approvals.
 * @env mutucar
 * @origin SH-149109
 */
const { paymentIds } = context;
// Get valid payments.
await doCmd({cmd: 'GetConfig', data: { path:'$.Payment.bulkActions' }});
const config = GetConfig.outData.pop();
if(typeof config == 'undefined' || config == null)
  throw '@Se requiere configurar los metodos de pago aprobados para esta accion.';
// Validar cuales pagos aplican
const query = `
  SELECT 
    id, paymentMethodCode
  FROM ClaimPayment payment
  WHERE paymentMethodCode IN ('${ config.paymentMethods.map( item => item.code).join("','") }')
  AND id IN (${ paymentIds.join() })
  --AND entityState != 'EXECUTED'`;
//await doCmd({cmd:'DoQuery',data:{ sql: query }});

//#region  Esta seccion corresponde a la creacion del workflow que generara el documento con los pagos realizados.
 const lineQuery = `SELECT
  con.cnp rut,
  ISNULL(con.surname1,'') apellidoPaterno,
  ISNULL(con.surname2,'') apellidoMaterno,
  ISNULL(con.name,'')     nombre,
  con.isPerson,
  pay.paymentMethodCode metodo,
  con.jCustomForms customForm,
  pay.date,
  pay.total
  FROM ClaimPayment pay
  INNER JOIN Contact con ON con.id = pay.contactId
  WHERE pay.id IN (${ paymentIds.join(',')  })
  AND pay.paymentMethodCode IN ('P1','P2')`;
  await doCmd({cmd:'DoQuery', data: { sql: lineQuery }});

  const documentLines = DoQuery.outData.filter( item => GetDatosFinancieros(item.customForm) )
  .map( payment => {
      const [ rut, digito ] = (payment.rut || '').split('-');
      const { code1, code2, sbif1, sbif2 , NumeroCuenta, NumeroCuenta2 } = GetDatosFinancieros(payment.customForm);
      const fechaPago = new Date(payment.date),
            mes = fechaPago.getMonth().toString().padStart(2,'0'),
            dia = fechaPago.getDate().toString().padStart(2,'0'),
            ani = fechaPago.getFullYear().toString()
      const value = [
          ChangeValueLength({ value: rut, length: 8 }), // 1
          ChangeValueLength({ value: digito, length: 1 }), // 2 
          ChangeValueLength({ value: payment.apellidoPaterno, length: 15 }), // 3
          ChangeValueLength({ value: payment.apellidoMaterno, length: 15 }), // 4
          ChangeValueLength({ value: payment.nombre, length: 15}), // 5
          ChangeValueLength({ value: '', length: 50}), // 6, 7 Direccion, Codigo comuna
          ChangeValueLength({ value: code1 || code2, length: 3}), // 8 Forma de pago
          ChangeValueLength({ value: NumeroCuenta || NumeroCuenta2, length: 15, direction: 'start', fill: '0' }), // 9 Numero de cuenta.
          ChangeValueLength({ value: sbif1 || sbif2, length: 3, fill: '0', direction: 'start' }), // 10 Codigo SBIF del banco
          ChangeValueLength({ value: '', length: 3}), // consecutivo 11,
          dia+mes+ani, // 12
         '000000000', // 13
          ChangeValueLength({ value: payment.total, length: 10, fill: '0', direction: 'start' }), // 14
          'BENEFICIOS\n' //15
      ];
      return value.join();
  });
  return documentLines
//   // Iniciar WF y registrar los valores.
//   await doCmd({ cmd: 'StartWorkflow', data:{ name: 'Solicitudes de pago aprobadas'}});
//   const { outData: { id: procesoId }} = StartWorkflow;
//   // Avanzar el wf y guardar los datos del certificado.
//   const userValues = [{
//     type: 'textarea',
//     required: true,
//     label: 'Pagos aprobados en este documento',
//     className: 'ant-input',
//     name: 'documentDetail',
//     access: false,
//     subtype: 'textarea',
//     userData: [documentLines.join('')]
//   }];
//   await doCmd({ cmd: 'GotoStep', data:{ estado: '_next', procesoId, userValues: JSON.stringify(userValues)}});
//   // Notificar al usuario via correo y push
//   await doCmd({cmd:'GetCurrentUser'});
//   const { outData: { email, environment, nombre }} = GetCurrentUser;

//   const url = `https://sisos.z28.web.core.windows.net/#/activity/${ procesoId }`;
//   const message = `<a href='${url}'> Se ha creado la actividad # ${ procesoId } para la obtencion del documento generado. Ver </a>`;
//   await doCmd({cmd:'SendNotification', data:{ usr: email, env: environment, title:'Documento de transferencia', msg: message, result: true }});
//   await doCmd({cmd:'UploadTxt', data:{ text: documentLines.join(''), fileName: 'Transferencias-'+new Date().getTime() + '.txt' }});
//   const { outData: { url: docUrl }} = UploadTxt;
//   await doCmd({cmd:'SendEmail', data:{ email, subject:'Documento de transferencia', text: `<h3> Estimado(a) ${ nombre }</h3>
//   <p>Se ha generado una actividad en el sistema para revisar el documento de transferencias </p>
//   <p> <a href='${ url }'> Ver Actividad </a> </p>
//   <p> <a href='https://sisos.z28.web.core.windows.net/#/openfile?d=1&url=${ docUrl }'> Descargar de forma segura.</a></p>` }});

//#endregion

return {
  ok: true,
  msg: `Se han encolado ${ DoQuery.outData.length } aprobaciones de pago.`,
  outData: DoQuery.outData
}


function GetDatosFinancieros(customForm){
  try {
      return JSON.parse(JSON.parse(customForm)['Datos financieros'])
                 .filter( item => item.userData)
                 .reduce((form, input)=>{ 
                    form[input.name] = input.userData.pop(); 
                    return form 
                  },{});
  } catch (error) {
      return false;
  }
}
/**
* 
* @param { String } value Original Value
* @param { Number } length Expected length
* @param { String } direction start | end ( padStart, padEnd)
* @param { String } fill Character to fill
* @returns { String } formated value
*/
function ChangeValueLength( { value, length, direction='end', fill = ' '}){
  const stringValue = (value || '').toString();
  let temp = stringValue.length > length ? stringValue.substring(0, length) : 
             direction == 'end' ? stringValue.padEnd(length,fill) : stringValue.padStart(length, fill)
  return temp;
}
}

module.exports = cmdBulkApproval;