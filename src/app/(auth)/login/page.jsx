"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginInputForm from './components/LoginInputForm';
import SocialLogin from './components/SocialLogin';

const LoginForm = () => {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Maiores, iusto?
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Social Login (Google / GitHub) */}
          <SocialLogin />

          {/* Divider already included in SocialLogin */}
          
          {/* Login Form */}
          <LoginInputForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
