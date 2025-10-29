"use server"

import dbConnect, { collectionNamesObj } from "@/lib/dbConnect"
import bcrypt from "bcrypt"

export const loginUser = async (payload) => {
const {email,password}=payload
const usercollection =dbConnect(collectionNamesObj.userCollection)
const user=await usercollection.findOne({email})
if(!user) return null
const isPasswordOk= bcrypt.compare(user.password,password)
if(!isPasswordOk) return null
return user
}