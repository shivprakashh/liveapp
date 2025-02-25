const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 4000;
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io")
const fs = require("fs");

const { json } = require("stream/consumers");
require("dotenv").config();
const server = http.createServer(app)
app.use(express.json());
let viewer =[];
// Allow all origins for CORS (can be restricted in production)
app.use(cors());



// Route to serve the index.html file
app.get("/", (req, resp) => {
    console.log(req.get("user-agent"))
    const filePath = path.join(__dirname, "public", "index.html");
    console.log("Serving file from:", filePath); // Log the path to check it's correct

    resp.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving file:", err);
            resp.status(500).send("Server Error: Unable to serve index.html.");
        }
    });
});

//hoster
app.post("/hoster",async (req,resp)=>{
    const key = req.body;
    const jsonkey = JSON.stringify(req.body,null,2);
    
    console.log(jsonkey,key,"this is key first is json")
    const filePath = "key.json";

    if(req.body.key){
                    // 🛠 Create file if it doesn't exist
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath,JSON.stringify([],null,2)); // Initialize empty JSON array
    }

    
        const rawData = fs.readFileSync(filePath);
     
        let existing = await JSON.parse(rawData);
       
        existing.push(key)
      
        const writeStream = fs.createWriteStream(filePath);
        writeStream.write(JSON.stringify(existing, null, 2));
        writeStream.end();
    

    // 🛠 Read existing data as a stream
   
    resp.status(200).send(jsonkey)
    }else{
        resp.status(400).send("error")
    }
    


})

app.post("/find",async(req,resp)=>{

const viewj = req.body;
console.log(viewj,"this is keysss")
const rawdata = fs.readFileSync("key.json")
const rawjson = JSON.parse(rawdata);
console.log(rawjson,"this raww json of my file key json")
const result = rawjson.find(item => item["key"]===req.body.key)
  if(result){
    console.log("found success fully",result)
    let viewjson ={liveusersocket:result.userid,key:req.body.key,}
    const liveperson = {key:req.body.key,viewperson:req.body.userid} // live person key and viewer socket id; pushing in viewer array;
    viewer.push(liveperson)
    resp.status(200).send(viewjson)

  }else{
    console.log(result,"do not found ");
    resp.status(400).send("no person exist")
  }

})
app.post("/end",async(req,resp)=>{
    
    try{
        const key = req.body;
        console.log(key,"enteringinto end ................")
    const rawData = fs.readFileSync("key.json");
        let jsonData = JSON.parse(rawData);

        // Use filter to keep only the items that do NOT match the key-value pair
        jsonData = jsonData.filter(item => item["key"] !== key.key);
    
        // Save the updated JSON file
        fs.writeFileSync("key.json", JSON.stringify(jsonData, null, 2));
    
        console.log(`✅ Deleted all items with ${key.key}`);
        resp.status(200).send("deleted!")
    }catch(error){
        console.log(error,"error in end rout")
        resp.status(400).send("you are not a user live is ended")
    }
   

})

// socket in the end
const io = socketio(server);
app.use(cors());
io.on('connection',(socket)=>{
   
    console.log(socket.id,"A user is connected")
  ;
socket.on("imconnect",async (d)=>{
    console.log(d.key,d.userid);
    
   
    /// find streamer id form d.key and send
    io.to(d.liveusersocket).emit("viewer-connected",{key:d.key,from:d.userid})
})
socket.on("offer",(d)=>{
    console.log(d.key,d.from,d.to,d.offer,"this is offer ")
    io.to(d.to).emit('offer', { key:d.key,from:d.from,offer:d.offer });
})
    // Relay answer from viewer to broadcaster
    
    socket.on('ice-candidate', (d) => {
        console.log('ICE candidate received');
        io.to(d.to).emit('ice-candidate', {from:d.from,candidate:d.candidate});
    });
    socket.on('answer', (d) => {
        console.log(d.to,d.from)
        // Send answer to the broadcaster
      
        io.to(d.to).emit('answer', {answer:d.answer ,from:d.from});
    });

    socket.on("viewer",(d)=>{
         console.log(d);
         socket.emit("vieweridget",socket.id)
    })
    socket.on('disconnect',()=>{
        console.log(socket.id,"user is disconnected")
    })
})

// socket ended




// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});
