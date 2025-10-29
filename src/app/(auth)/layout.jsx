import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const layout = ({children}) => {
    return (
        <div className='relative flex flex-col min-h-svh items-center justify-center p-4'>
            <Link href="/"
            className={buttonVariants(
                {variant: 'outline',
                className: 'absolute top-4 left-4 md:top-8 md:left-8'
                },
                
            )}
            >  
                <ArrowLeft className='size-4'/>
                Back to Home
            </Link>

            <div className='flex max-w-sm flex-col w-full gap-6'>
                <Link href='/'
                
                className='flex items-center gap-2 self-center font-medium'>
                <Image src='/vercel.svg' width={32} height={32} alt='Logo' />
                Video Summarizer App
                </Link>
                {children} 
                <div className='text-balance text-center text-muted-foreground'>
                    By clicking continue, you agree to our<span className='hover:text-primary hover:underline'>Terms of service</span>
                    {" "} <span>Privacy Policy</span>
                </div>
            </div> 

        </div>
    );
};

export default layout;