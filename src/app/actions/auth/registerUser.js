"use server"

import dbConnect, { collectionNamesObj } from "@/lib/dbConnect";
import bcrypt from "bcrypt"

const registerUser = async (payload) => {
        const userCollection = dbConnect(collectionNamesObj.userCollection)

        const { email, password } = payload
   if (!email || !password) return null

 const user = await userCollection.findOne({ email: payload.email })
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10)
            payload.password = hashedPassword
            const result = await userCollection.insertOne(payload)
            const { acknowledged, insertedId } = result
            return { acknowledged, insertedId: insertedId.toString() }
        }
        return null
};

export default registerUser;