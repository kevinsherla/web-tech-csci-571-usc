const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = 3000;
const app_key = "KevinShe-assignme-PRD-c727b8eb0-b55a0d9c";

function generateEbayUrl(input) {
    let params = {
        'OPERATION-NAME': 'findItemsAdvanced',
        'paginationInput.entriesPerPage': 50,
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': app_key,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': input.keyword,
        'buyerPostalCode': input.zipCode,
        // 'categoryId': input.category,
        // 'PostalCode': input.zipCode,
        // 'itemFilter(0).name': 'MaxDistance',
        // 'itemFilter(0).value': input.distance,

    };

    let filterIndex = 0;

    if (input.category && input.category.toLowerCase() !== 'all') {
        params['categoryId'] = input.category;
    }
    params['itemFilter(0).name'] = 'MaxDistance';
    params['itemFilter(0).value'] = input.distance;
    // console.log(params);

    if (input.condition) {
        const conditionMap = { new: '1000', used: '3000'};
        let conditionValues = [];
        for (let condition in input.condition) {
            if (input.condition[condition]) {
                conditionValues.push(conditionMap[condition]);
            }
        }
        if (conditionValues.length > 0) {
            params[`itemFilter(${filterIndex}).name`] = 'Condition';
            conditionValues.forEach((value, index) => {
                params[`itemFilter(${filterIndex}).value(${index})`] = value;
            });
            filterIndex++;
        }
    }

    if (input.shipping) {
        if (input.shipping.freeShipping) {
            params[`itemFilter(${filterIndex}).name`] = 'FreeShippingOnly';
            params[`itemFilter(${filterIndex}).value`] = true;
            filterIndex++;
        }
        if (input.shipping.localPickup) {
            params[`itemFilter(${filterIndex}).name`] = 'LocalPickupOnly';
            params[`itemFilter(${filterIndex}).value`] = true;
            filterIndex++;
        }
    }

    return `https://svcs.ebay.com/services/search/FindingService/v1?${qs.stringify(params)}`;
}


class OAuthToken {
    constructor(client_id, client_secret) {
        this.client_id = client_id;
        this.client_secret = client_secret;
    }

    getBase64Encoding() {
        return Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64');
    }

    async getApplicationToken() {
        const url = "https://api.ebay.com/identity/v1/oauth2/token";
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${this.getBase64Encoding()}`
        };
        const data = qs.stringify({
            'grant_type': 'client_credentials',
            'scope': 'https://api.ebay.com/oauth/api_scope'
        });
        const response = await axios.post(url, data, { headers });
        return response.data.access_token;
    }
}


app.use(cors());
app.use(cors({
    origin: 'http://localhost:4200' // replace with your frontend domain
  }));
  

// Middleware to parse JSON data from POST requests
app.use(bodyParser.json());

// Route to handle form submissions from frontend
app.post('/api/ebay-search', async (req, res) => {
    let url = generateEbayUrl(req.body);
    try {
        const response = await axios.get(url);
        // console.log(url);
        res.status(200).send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/api/getItem', async (req, res) => {
    const client_id = 'KevinShe-assignme-PRD-c727b8eb0-b55a0d9c';
    const client_secret = 'PRD-727b8eb0e42d-5160-45da-90b0-eca5';
    const item_id = req.query.itemId;
    const oauth_token = new OAuthToken(client_id, client_secret);
    const access_token = await oauth_token.getApplicationToken();

    const endpoint = 'https://open.api.ebay.com/shopping?';
    const headers = {
        'X-EBAY-API-IAF-TOKEN': access_token
    };
    const params = {
        callname: 'GetSingleItem',
        version: '967',
        responseencoding: 'JSON',
        siteid: '0',
        ItemID: item_id,
        IncludeSelector: 'Details, ItemSpecifics'
    };

    try {
        const response = await axios.get(endpoint, { params, headers });
        res.json(response.data);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).send("An error occurred");
    }
});

const API_KEY = 'AIzaSyDLkKrhV-UAYq5kz9aVNorjOTuS3jYrO3w';
const CX = 'f7a843f72eb524bbb';

app.get('/api/photos', async (req, res) => {
  const title = req.query.title;
  const url = `https://www.googleapis.com/customsearch/v1`;
  const params = {
    q: title,
    cx: CX,
    imgSize: 'huge',
    // imgType: 'news',
    num: 8,
    searchType: 'image',
    key: API_KEY
  };

  try {
    const response = await axios.get(url, { params });
    // Send back the relevant data to the front end
    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching photos from Google API:backedn', error);
    res.status(500).send('Error fetching photos backend');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});