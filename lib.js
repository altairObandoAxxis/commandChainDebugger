const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache();
require('dotenv').config();
/**
 * Este comando permite efectuar una consulta al canal de sis11
 * @param { String } cmd Comando a ejecutar
 * @param { Object } data Argumentos
 * @returns Object Response
 * @author Noel Obando
 */
async function doCmd({ cmd, data }){
    const token = await getToken();
    try {
        const response = await axios.post(process.env.API_URL, { cmd, data },{ headers: { 'Authorization': `Bearer ${ token }` }});
        global[cmd] = response.data;
        return response.data
    } catch (error) {
        global[cmd] = error.response.data;
    }
}
/**
 * Permite el inicio de sesion de un usuario de sis11 con las 
 * variables configuradas en el entorno (.env)
 * @returns { String } token de autenticacion
 * @author Noel Obando
 */
async function getToken(){
    try{
        if(await cache.get('Token'))
            return await cache.get('Token');

        const response = await axios.post(process.env.API_LOGIN,{ email: process.env.API_USER, clave: process.env.API_PASS });
        const { ok, msg, outData: { token }} = response.data;
        if(!ok)
            throw msg;
        cache.set('Token', token);
        return token
    }catch(error){
        throw error
    }
}

module.exports = { 
    doCmd,
    getToken
}