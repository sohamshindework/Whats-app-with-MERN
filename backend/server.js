

//importing all the stuff
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';


//app config
const app=express()
const port=process.env.PORT || 9000
const pusher = new Pusher({
    appId: "1149755",
    key: "0c328d6d0d304e8445da",
    secret: "4197adf414e23e8c999e",
    cluster: "ap2",
    useTLS: true 
});
//middleware
app.use(express.json())
app.use(cors())


//database config-mongo
const connection_url='mongodb+srv://soham:Soham@123@cluster0.l5jmw.mongodb.net/<whatsappdb>?retryWrites=true&w=majority'
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db=mongoose.connection

db.once('open',()=>{
    console.log("DB connnected");

    const msgCollection=db.collection('messagecontents');
    const changeStream=msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log("Change occured",change);

        if(change.operationType==='insert'){
            const messageDetails=change.fullDocument;
            pusher.trigger('messages','inserted', {
                    name: messageDetails.name,
                    message:messageDetails.message,
                    timestamp:messageDetails.timestamp,
                    recieved:messageDetails.recieved,
                });
        } else{
            console.log('Error triggering Pusher')
        }
    });
});

//??

//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'))   //200-okay 201-create
app.get("/messages/sync", (req, res) =>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err) //if internal error
        }else{
            res.status(200).send(data)
        }
    })
})
app.post("/messages/new", (req, res) =>{
    const dbMessage=req.body

    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err) //if internal error
        }else{
            res.status(201).send(data)
        }
    });
});
//listener
app.listen(port, () => console.log(`Listening on localhost:${port}`));