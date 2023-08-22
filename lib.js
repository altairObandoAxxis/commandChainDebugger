const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache();
require('dotenv').config();

const doCmd = async ({ cmd, data }) =>{
    const token = cache.get('Token') || await getToken();
    try {
        const response = await axios.post(process.env.API_URL, { cmd, data },{ headers: { 'Authorization': `Bearer ${ token }` }});
        global[cmd] = response.data;
        return response.data
    } catch (error) {
        global[cmd] = { cmd, outData: null , msg: error }
    }
}

const getToken = async()=>{
    try{
        const response = await axios.post(process.env.API_LOGIN,{ email: process.env.API_USER, clave: process.env.API_PASS});
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
    doCmd
}