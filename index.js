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
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('lucky_tools').collection('services');
    const userCollection = client.db('lucky_tools').collection('users');
    const bookingCollection = client.db('lucky_tools').collection('bookings');
    const paymentCollection = client.db('lucky_tools').collection('payments');

      app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ accessToken });
        });
    app.get('/service', async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services)
    });
    app.post('/service', async (req, res) => {
        const doctor = req.body;
        const result = await serviceCollection.insertOne(doctor);
        res.send(result);
      })
    app.get('/user', async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
    });
    
     app.get('/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })

      app.put('/user/admin/:email',async (req, res) => {
        const email = req.params.email;  
        const filter = { email: email };       
        const updateDoc = {
        $set: {role:'admin'},
        };
        const result=await userCollection.updateOne(filter,updateDoc)
        res.send(result);
        
        
      })
    
    app.get('/booking/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    })
    app.get('/booking',verifyJWT, async(req, res) =>{
        const customer = req.query.customer;
        
        const decodedEmail = req.decoded.email;
        if (customer === decodedEmail) {
          const query = {customer: customer};
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);
        }
        else {
          return res.status(403).send({message:'Forbidden access'})
        }
      
      })
    app.post('/booking', async (req, res) => {
        const booking = req.body;
        const query = { service: booking.service, price: booking.price, customer: booking.customer,customerName:booking.customerName }
        const exists = await bookingCollection.findOne(query)
        
        const result = await bookingCollection.insertOne(booking)
        return res.send({ success: true, result })
    });
    // app.delete('/booking/:id', async (req, res) => {
    //         const id = req.params.id;
    //         const query = { _id: ObjectId(id) };
    //         const result = await bookingCollection.deleteOne(query);
    //         res.send(result);
    //     });
   

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