const axios = require('axios');
require('dotenv').config();

const doCmd = async ({ cmd, data }) =>{
    try {
        const response = await axios.post(process.env.API_URL, { cmd, data },{ headers: { 'Authorization': `Bearer ${ process.env.API_TOKEN }` }});
        global[cmd] = response.data;
        return response.data
    } catch (error) {
        global[cmd] = { cmd, outData: null , msg: error }
    }
}

module.exports = { 
    doCmd
}