"use client"
import React from 'react';
import { signIn, signOut } from "next-auth/react"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


const LoginInputForm = () => {
      const router=useRouter()

    const handleSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;

  const email = form.email.value;     // 👈 works if name="email"
  const password = form.password.value; // 👈 works if name="password"
  toast("Submitting....")
 
        try {
          const response=  await signIn('credentials', { email, password, callbackUrl: '/', redirect: false })

            if(response.ok){
                toast.success("Logged In Successfully")
                router.push("/")
                form.reset()
            }else{
                toast.error("Failed To Login ")

            }
            // router.push('/')

        } catch (error) {
                toast.error("Failed To Login ")

        }

};
    return (
    <form onSubmit={handleSubmit}>
  <div className="grid gap-2 my-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      name="email"  // 👈 this is required
      type="email" 
      placeholder="jhon@gmail.com" 
    />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="password">Password</Label>
    <Input 
      id="password" 
      name="password"  // 👈 this is required
      type="password" 
      placeholder="********" 
    />
  </div>
  <Button type="submit" className="w-full mt-4">
    Continue With Email
  </Button>
</form>

    );
};

export default LoginInputForm;