const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjbqr.mongodb.net/?retryWrites=true&w=majority"`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({message:'UnAuthorized access'})
    
  }
  const token = authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({message:'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('lucky_tools').collection('services');
    const userCollection = client.db('lucky_tools').collection('users');
    const bookingCollection = client.db('lucky_tools').collection('bookings');
    const paymentCollection = client.db('lucky_tools').collection('payments');

    

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
    
      app.get('/booking', async(req, res) =>{
      const customer = req.query.customer;
        
      const query = {customer: customer};
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);
       
      })
    app.get('/booking/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    })
    app.post('/booking', async (req, res) => {
        const booking = req.body;
        const query = { service: booking.service, price: booking.price, customer: booking.customer,customerName:booking.customerName }
        const exists = await bookingCollection.findOne(query)
        
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