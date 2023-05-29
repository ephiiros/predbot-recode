import * as dotenv from "dotenv";
import { MongoClient, Collection } from "mongodb";
import fs from "fs"
import { Message} from "discord.js";

dotenv.config()

export async function connectToDatabase () {
    console.log("trying to connect")
    const client = new MongoClient(process.env.DB_CONN_STRING as string)
    await client.connect()
    console.log(client)
    const db = client.db(process.env.DB_NAME)
    console.log(db)
    console.log("connected")
}

export async function addServer (server: Server) {
    console.log("adding server")
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const servers = database.collection("servers")
    const result = await servers.replaceOne(
        {
            "id": server.id
        },
        {
            "id": server.id
        },
        { 
            upsert: true
        }
    )
    console.log(result)
}

export const collections: { games?: Collection } = {}

export interface JsonData {
    servers: Server[],
    users: User[]
}

export interface Server {
    id: string,
    channel: string,
    messages: Bo1Message[]
}

export interface Bo1Message {
    id: string,
    blue: string[],
    red: string[], 
}

export interface User {
    id: string,
    history: Match[],
    totalpoints: number
}

export interface Match {
    matchid: string,
    vote: string,
    winner: string,
    points: string
}


export async function getServers(): Promise<Server[]>  {
    // the relative is from wehre you run it 
    const jsonString = fs.readFileSync("./src/libs/testdata.json", "utf-8");
    const data:JsonData = JSON.parse(jsonString)
    return data.servers
}

export async function getServerData(serverId: string): Promise<Server | null> {
    fs.readFile("./src/libs/testdata.json", "utf-8", (err, jsonString) => {
        if (err) {
            console.log("Read File Failed")
            console.log(err)
            return
        } else {
            const data:JsonData = JSON.parse(jsonString)

            return data.servers.filter(
                function(servers){ return servers.id == serverId}
            )[0]
        }
    })
    return null
}

export async function writeMessagesToServer(messageList: Message[], serverId: string) {
    fs.readFile('./src/libs/testdata.json', 'utf8', (err, data) => {
        if (err){
            console.log(err);
        } else {
            let messageJsonList:Bo1Message[] = []

            messageList.forEach(message => {
                messageJsonList.push({
                    id: message.id,
                    blue: [],
                    red: []
                })
            });

            let obj:JsonData = JSON.parse(data); 

            obj.servers.filter(
                function(servers){ return servers.id == serverId}
            )[0].messages = messageJsonList

            let outputJson = JSON.stringify(obj); 

            fs.writeFile('./src/libs/testdata.json', outputJson, 'utf8', (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }
    })
    console.log("[" + serverId + "] Written messages")
}

export async function writeVotes(message:Message) {
    fs.readFile('./src/libs/testdata.json', 'utf8', (err, data) => {
        if (err){
            console.log(err);
        } else {

            const onePromise = message.reactions.cache.get('1️⃣')?.users.fetch()

            const twoPromise = message.reactions.cache.get('2️⃣')?.users.fetch()

            Promise.all([onePromise, twoPromise]).then((values)=>{

                console.log("message " + message.id + " resolved") 
                const votedOne:string[] = []
                const votedTwo:string[] = []
                values[0]?.forEach((user) => {
                    votedOne.push(user.id)
                })
                values[1]?.forEach((user) => {
                    votedTwo.push(user.id)
                })

                console.log(votedOne)
                console.log(votedTwo)

                let obj:JsonData = JSON.parse(data); 

                obj.servers.filter(
                    function(servers){ return servers.id == message.guildId}
                )[0].messages.filter(
                    function(messages){ return messages.id == message.id}
                )[0].blue = votedOne

                obj.servers.filter(
                    function(servers){ return servers.id == message.guildId}
                )[0].messages.filter(
                    function(messages){ return messages.id == message.id}
                )[0].red = votedTwo

                console.log(obj.servers.filter(
                    function(servers){ return servers.id == message.guildId}
                )[0].messages.filter(
                    function(messages){ return messages.id == message.id}
                )[0])

                let outputJson = JSON.stringify(obj); 

                return outputJson
            }).then((outputJson) => {
                fs.writeFile('./src/libs/testdata.json', outputJson, 'utf8', (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
                console.log("[" + message.guildId+"] Written votes for " + message.id)

            })
        }
    })
}