import * as dotenv from "dotenv";
import { MongoClient, Collection } from "mongodb";
import { Message, TextChannel} from "discord.js";

dotenv.config()

export const collections: { games?: Collection } = {}

export interface JsonData {
    servers: Server[],
    users: User[]
}

export interface Server {
    id: string,
    channel: string,
    messages: Bo1Message[] | Bo3Message[],
    timezone: string,
    leagues: string[]
}

export interface Bo1Message {
    matchId: string,
    id: string,
    blue: string[],
    red: string[], 
}

export interface Bo3Message {
    matchId: string,
    ids: string[],
    vote20: string[],
    vote21: string[],
    vote12: string[],
    vote02: string[]
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

export async function updateServerChannel (serverId:string, channelId:TextChannel) {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const servers = database.collection("servers")

    await servers.updateOne(
        {
            "id": { $eq: serverId }
        },
        {
            $set: {
                "channel": channelId.id
            }
        }
    )
}

export async function updateServerLeague (serverId: string, leagues: string[]) {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const servers = database.collection("servers")

    await servers.updateOne(
        {
            "id": { $eq: serverId }
        },
        {
            $set: {
                "leagues": leagues
            }
        }
    )
}

export async function addServer (server: Server) {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const servers = database.collection("servers")

    console.log("check if server exists")
    const findRes = await servers.findOne({
        "id": server.id
    })

    if (findRes) {
        console.log("server already exists in db")
    } else {
        console.log("need to add server ")
        const result = await servers.insertOne({
            "id": server.id
        })
        console.log(result)
    }
}

export async function getServers(): Promise<Server[]>  {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const servers = database.collection("servers")

    const result = await servers.find().toArray()
    const serverList:Server[] = [] 
    result.forEach(item => {
        serverList.push({
            "id": item.id,
            "channel": item.channel,
            "messages": [],
            "timezone": item.timezone,
            "leagues": item.leagues
        })
        
    });
    return serverList as Server[]

}

export async function writeBo3(bo3Message: Bo3Message, serverId: string) {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const messages = database.collection("messages")

    const result = await messages.insertOne({
        "serverId": serverId,
        "matchId": bo3Message.matchId,
        "ids": bo3Message.ids,
        "vote20": bo3Message.vote20,
        "vote21": bo3Message.vote21,
        "vote12": bo3Message.vote12,
        "vote02": bo3Message.vote02
    })

    if (result) {}
}

export async function writeVotes(message:Message) {
    const onePromise = message.reactions.cache.get('1️⃣')?.users.fetch()
    const twoPromise = message.reactions.cache.get('2️⃣')?.users.fetch()

    Promise.all([onePromise, twoPromise]).then((values)=>{
        values
    })
}

export async function findMatchMessage(matchId: string, serverId: string) {
    const uri:string = process.env.DB_CONN_STRING as string
    const client = new MongoClient(uri)
    const database = client.db("predbot")
    const messages = database.collection("messages")


    const result = await messages.findOne(
        {
            "serverId": serverId,
            "matchId": matchId
        }
    )


    return result
}