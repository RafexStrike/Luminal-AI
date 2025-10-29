"use client";
import { FaGithub } from "react-icons/fa6";
import { FaGithubAlt, FaGoogle } from "react-icons/fa";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function SocialLogin() {
  const router = useRouter();
  const session = useSession();
  console.log(session)

  const handleSocialLogin = async (providerName) => {
    await signIn(providerName,{redirect:false});
  };

  useEffect(() => {
    if (session?.status == "authenticated") {
      router.push("/");
      toast("Successfully Logged IN");
    }
  }, [session?.status]);

  return (
      <div className="flex flex-col gap-3">
      {/* Divider */}
      <div className="relative text-center text-sm my-2 after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-card px-2">Or Continue With</span>
      </div>

      {/* Social Buttons */}
      <Button
        className="w-full flex items-center gap-2"
        variant="outline"
        onClick={()=>handleSocialLogin("google")}
      >
        <FaGoogle className=" h-5 w-5" />
        Google
      </Button>

      <Button
        className="w-full flex items-center gap-2"
        variant="outline"
        onClick={()=>handleSocialLogin("github")}
      >
        <FaGithubAlt className="h-5 w-5" />
        GitHub
      </Button>
    </div>
  );
}