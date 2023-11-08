const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = 3000;
const app_key = "KevinShe-assignme-PRD-c727b8eb0-b55a0d9c";
const { MongoClient, ObjectID }= require('mongodb');
const { ObjectId } = require('mongodb');



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
    origin: 'http://localhost:4200' 
  }));
  

app.use(bodyParser.json());

app.get('/api/ebay-search', async (req, res) => {
  let url = generateEbayUrl(req.query);
  try {
      const response = await axios.get(url);
      // console.log(url);
      res.status(200).send(response.data);
      // console.log("lol");
  } catch (error) {
      console.log("sdfsd",error);
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
    
    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching photos from Google API:backedn', error);
    res.status(500).send('Error fetching photos backend');
  }
});

app.get('/api/similaritems', async (req, res) => {
    const itemId = req.query.itemId; 
    const url = 'https://svcs.ebay.com/MerchandisingService';
  
    const params = {
      'OPERATION-NAME': 'getSimilarItems',
      'SERVICE-NAME': 'MerchandisingService',
      'SERVICE-VERSION': '1.1.0',
      'CONSUMER-ID': 'KevinShe-assignme-PRD-c727b8eb0-b55a0d9c',
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      itemId: itemId,
      maxResults: 20
    };
  
    try {
      const response = await axios.get(url, { params });
      res.json(response.data.getSimilarItemsResponse.itemRecommendations.item);
    } catch (error) {
      console.error('Error fetching similar items from eBay API:', error);
      res.status(500).send('Error fetching similar items');
    }
  });

app.get('/api/zip-code-suggestions', async (req, res) => {
    const val = req.query.val; 
    if (val && val.length >= 1) {
        const apiUrl = `http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith=${val}&country=US&maxRows=5&username=kevin.sherla`;
        try {
            const response = await axios.get(apiUrl);
            res.status(200).json(response.data.postalCodes || []);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    } else {
        res.status(400).send('Invalid zip code input');
    }
});

const uri = "mongodb+srv://sherla:usc@ebay.k3z7z3u.mongodb.net/<database>";

async function connectToMongoDB() {
    const client = new MongoClient(uri);
  
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      return client; 
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }
  
  module.exports = connectToMongoDB;

connectToMongoDB().then((db) => {

}).catch((error) => {
  console.error("Error in MongoDB connection:", error);
});

app.post('/api/saveItem', async (req, res) => {
    try {
      const client = await connectToMongoDB();
      
      const db = client.db();
  
      const collection = db.collection('ass3');
      
      const result = await collection.insertOne(req.body);
      
      await client.close();
  
      res.status(201).json({ message: 'Item saved successfully' });
    } catch (error) {
      console.error('Error saving item to MongoDB:', error);
      res.status(500).json({ error: 'Failed to save item to MongoDB' });
    }
  });

app.get('/api/getItems', async (req, res) => {
    try {
      const client = await connectToMongoDB();
    
      const db = client.db();
  
      const collection = db.collection('ass3'); 

      const items = await collection.find({}).toArray();
      
      await client.close();
  
      res.status(200).json(items);
    } catch (error) {
      console.error('Error retrieving items from MongoDB:', error);
      res.status(500).json({ error: 'Failed to retrieve items from MongoDB' });
    }
  });
  
  app.delete('/api/removeItem/:itemId', async (req, res) => {
    try {
      const itemId = req.params.itemId;
      const client = await connectToMongoDB();
      const db = client.db();
      const collection = db.collection('ass3');

      const objectId = new ObjectId(itemId);
      const result = await collection.deleteOne({ _id: objectId });
  
      if (result.deletedCount === 1) {
        console.log(`Item with ID ${itemId} removed from MongoDB`);
        res.status(200).json({ message: 'Item removed successfully' });
      } else {
        console.log(`Item with ID ${itemId} not found`);
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
// app.use(express.static("./dist/my-app"))
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});