import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { loginUser } from "@/app/actions/auth/loginUser";
import dbConnect, { collectionNamesObj } from "./dbConnect";

export const authOptions = {
  // Configure one or more authentication providers
providers: [
  CredentialsProvider({
    // The name to display on the sign in form (e.g. "Sign in with...")
    name: "Credentials",
    // `credentials` is used to generate a form on the sign in page.
    // You can specify which fields should be submitted, by adding keys to the `credentials` object.
    // e.g. domain, username, password, 2FA token, etc.
    // You can pass any HTML attribute to the <input> tag through the object.
    credentials: {
      email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials, req) {
      // Add logic here to look up the user from the credentials supplied
      const user = await loginUser(credentials)
      console.log(user)
      if (user) {
        // Any object returned will be saved in `user` property of the JWT
        return user
      } else {
        // If you return null then an error will be displayed advising the user to check their details.
        return null

        // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
      }
    }
  }),
  GoogleProvider({
    clientId: process.env.Google_Client_ID,
    clientSecret: process.env.Google_Client_Secret
  }),
    GitHubProvider({
    clientId: process.env.Github_Client_ID,
    clientSecret: process.env.Github_Client_Secret
  })

],
pages:{
    signIn:"/login"
},
 callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
    //   console.log({user, account, profile, email, credentials })
      if(account){
          const {provider,providerAccountId}=account
          const {email:user_email,image,name}=user
          const userCollection=dbConnect(collectionNamesObj.userCollection)
        const isExisted=await userCollection.findOne({providerAccountId})
        if(!isExisted){
            const payload={providerAccountId,provider,email:user_email,image,name}
            await userCollection.insertOne(payload)
        }
      }

      return true
    },
}
}