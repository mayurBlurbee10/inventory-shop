"use client";

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchWrapper } from '@/app/lib/fetchWrapper';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Common/Elements/Button';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const params = useParams();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false)
    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Please enter your email.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetchWrapper('/api/users/resendInviteLink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, portalid: params.portalid }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend invite link.');
            }
            toast.success('Invite sent successfully');
            setShowSuccess(true)
        } catch (error) {
            toast.error(error.message);
        }

        setIsLoading(false);
    };

    const handleBackToLogin = () => {
        router.push(`login`);
    };

    return (
        <div className='w-full h-screen flex justify-center items-center border bg-white'>
            {
                showSuccess ? (
                    <div className="w-full max-w-sm mx-auto p-8 bg-white rounded-lg flex flex-col justify-center items-center space-y-5 border">
                        <div className='flex flex-col justify-center items-center'>
                            <p className="text-lg text-green-600 text-center font-bold mb-2">You have got an email to reset your password. please check</p>
                            <Button
                                label='OK'
                                type='Primary'
                                onClick={() => router.push('login')}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-sm mx-auto p-8 bg-white rounded-lg flex flex-col justify-center items-center space-y-5 border">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Forgot your password?</h2>
                            <p className="text-sm text-gray-600 mt-1">Enter your email so that we can send you password reset link</p>
                        </div>
                        <input
                            type="email"
                            className="border rounded-lg p-3 w-full text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. username@kinety.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button
                            label="Send Email"
                            type="Primary"
                            onClick={handleForgotPassword}
                            // onClick={() => setShowSuccess(true)}
                            isLoading={isLoading}
                            disabled={!email}
                        />
                        <button onClick={handleBackToLogin} className="flex items-center text-sm text-gray-500 hover:text-gray-700" >
                            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
                        </button>
                    </div>
                )
            }
        </div>


    );
};

export default ForgotPassword;