"use strict"

const axios = require('axios')

const baseUrl = "https://api-pub.bitfinex.com/v2/";
const pathParams = "ticker/tBTCUSD" 

axios.get(`${baseUrl}/${pathParams}`)
    .then(response => {
        console.log(response.data);
    }, error => {
        console.log(error);
    })
