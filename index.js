const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({message:'Forbidden access'})
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
    
    
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjbqr.mongodb.net/?retryWrites=true&w=majority"`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('lucky_tools').collection('services');
    const userCollection = client.db('lucky_tools').collection('users');
    const bookingCollection = client.db('lucky_tools').collection('bookings');
    app.get('/service', async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services)
    });
    app.get('/user', async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });

    app.post('/booking', async (req, res) => {
        const booking = req.body;
        const query = { service: booking.service, price: booking.price, customer: booking.customer,customerName:booking.customerName }
        const exists = await bookingCollection.findOne(query)
        // if (exists) {
        //   return res.send({ success: false, booking: exists })
        // }
        const result = await bookingCollection.insertOne(booking)
        return res.send({ success: true, result })
      });

  }
  finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from lucky tools')
})

app.listen(port, () => {
  console.log(`listening port ${port}`)
})