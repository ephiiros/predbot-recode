import * as dotenv from "dotenv";
import { MongoClient, Collection } from "mongodb";
import { TextChannel} from "discord.js";

dotenv.config()

export const collections: { games?: Collection } = {}

export interface JsonData {
    servers: Server[],
    users: User[]
}

export interface Server {
    id: string,
    channel: string,
    timezone: string,
    leagues: string[]
}

export interface Bo1Message {
    matchId: string,
    serverId: string,
    ids: string[],
    vote1: string[],
    vote2: string[], 
}

export interface Bo3Message {
    matchId: string,
    serverId: string,
    ids: string[],
    vote20: string[],
    vote21: string[],
    vote12: string[],
    vote02: string[]
}

export interface Bo5Message {
    matchId: string,
    serverId: string,
    ids: string[],
    vote30: string[],
    vote31: string[],
    vote32: string[],
    vote23: string[],
    vote13: string[],
    vote03: string[]
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

let connection: MongoClient | null = null

function getConnection() {
    if (connection == null) {
        const uri:string = process.env.DB_CONN_STRING as string
        connection = new MongoClient(uri)
    }
    return connection
}

export async function updateServerChannel (serverId:string, channelId:TextChannel) {
    const client = getConnection()
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
    const client = getConnection()
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
    const client = getConnection()
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
    const client = getConnection()
    const database = client.db("predbot")
    const servers = database.collection("servers")

    const result = await servers.find().toArray()
    const serverList:Server[] = [] 
    result.forEach(item => {
        serverList.push({
            "id": item.id,
            "channel": item.channel,
            "timezone": item.timezone,
            "leagues": item.leagues
        })
        
    });
    return serverList as Server[]
}


export async function writeMessage(message: Bo5Message | Bo3Message | Bo1Message, serverId: string) {
    const client = getConnection()
    const database = client.db("predbot")
    const messages = database.collection("messages")

    if (message.ids.length == 1) {
        const bo1Message = message as Bo1Message

        await messages.insertOne({
            "serverId": serverId,
            "matchId": bo1Message.matchId,
            "ids": bo1Message.ids,
            "vote1": bo1Message.vote1,
            "vote2": bo1Message.vote2,
        })

    } else if (message.ids.length == 5) {
        const bo3Message = message as Bo3Message

        await messages.insertOne({
            "serverId": serverId,
            "matchId": bo3Message.matchId,
            "ids": bo3Message.ids,
            "vote20": bo3Message.vote20,
            "vote21": bo3Message.vote21,
            "vote12": bo3Message.vote12,
            "vote02": bo3Message.vote02
        })
    } else if (message.ids.length == 7) {
        const bo5Message = message as Bo5Message

        await messages.insertOne({
            "serverId": serverId,
            "matchId": bo5Message.matchId,
            "ids": bo5Message.ids,
            "vote30": bo5Message.vote30,
            "vote31": bo5Message.vote31,
            "vote32": bo5Message.vote32,
            "vote23": bo5Message.vote23,
            "vote13": bo5Message.vote13,
            "vote03": bo5Message.vote03
        })
    }
}

export async function lockMatch(message:Bo1Message | Bo3Message |Bo5Message ,serverId:string) {
    const client = getConnection()
    const database = client.db("predbot")
    const messages = database.collection("messages")

    if (message.ids.length == 1) {
        const bo1Message = message as Bo1Message
        await messages.replaceOne(
            {
                "serverId": serverId,
                "matchId": bo1Message.matchId
            },
            {
                "serverId": serverId,
                "matchId": bo1Message.matchId,
                "ids": bo1Message.ids,
                "vote1": bo1Message.vote1,
                "vote2": bo1Message.vote2,
            }
        )

    } else if (message.ids.length == 5) {
        const bo3Message = message as Bo3Message
        await messages.replaceOne(
            {
                "serverId": serverId,
                "matchId": bo3Message.matchId

            },
            {
                "serverId": serverId,
                "matchId": bo3Message.matchId,
                "ids": bo3Message.ids,
                "vote20": bo3Message.vote20,
                "vote21": bo3Message.vote21,
                "vote12": bo3Message.vote12,
                "vote02": bo3Message.vote02,
            }
        )
    } else if (message.ids.length == 7) {
        const bo5Message = message as Bo5Message
        await messages.replaceOne(
            {
                "serverId": serverId,
                "matchId": bo5Message.matchId

            },
            {
                "serverId": serverId,
                "matchId": bo5Message.matchId,
                "ids": bo5Message.ids,
                "vote30": bo5Message.vote30,
                "vote31": bo5Message.vote31,
                "vote32": bo5Message.vote32,
                "vote23": bo5Message.vote23,
                "vote13": bo5Message.vote13,
                "vote03": bo5Message.vote03,
            }
        )
    }
}

export async function findMatchMessage(matchId: string, serverId: string) {
    const client = getConnection()
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

export async function commitVote(userId:string, vote:Object) {
    const client = getConnection()
    const database = client.db("predbot")
    const users = database.collection("users")

    users.updateOne(
        {
            "id": userId
        },
        {
            $push: { history: vote }
        },
        {
            upsert: true
        }
    )
}

export async function getUsers() {
    const client = getConnection()
    const database = client.db("predbot")
    const users = database.collection("users")

    const cursor = await users.find({})
    const result = await cursor.toArray()

    return result
}

export async function getHistory(userId:string) {
    const client = getConnection()
    const database = client.db("predbot")
    const users = database.collection("users")

    const result = await users.findOne(
        {
            "id": userId
        }
    )

    return result
}