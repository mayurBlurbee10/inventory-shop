"use client";
import Button from '@/components/Common/Elements/Button';
import { setCurrentUser } from '@/store/services/userService';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

const CredentialPage = () => {
  const{data:user} = useSelector((state) => state.user);
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('isNew') === 'true';
  const logoURL = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/MStrategy_Group.png`;

  const handleGoToLogin = () => {
    const { credential, ...userWithoutCredential } = user;
    dispatch(setCurrentUser(userWithoutCredential));
    router.push(`/${params.portalid ?? 'admin'}/login`)
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg">
        
        <div className="w-full flex justify-center">
          <div
            style={{
              width: "100px",
              height: "80px",
              backgroundImage: `url(${logoURL})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        </div>
          <h2 className="text-xl font-bold text-center text-gray-800">
            Save Your Login Credentials
          </h2>
        <hr className="mt-3 border-gray-200" />
        <div className='w-full p-6'>
            <div className="flex flex-col items-center justify-center">
            <h2 className="font-semibold text-gray-600 mb-2 text-center">
              Your login credentials have been generated
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Please take a screenshot or securely store the details below.
            </p>
            <div className="text-center mb-6">
              <p className="text-gray-600 font-semibold mb-2">Your Credentials:</p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-600">User ID:</span> {user?.credential?.userID}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-600">Password:</span> {user?.credential?.password}
              </p>
            </div>

          {
            isNew && (
              <div className="text-center mb-6">
                <p className="text-gray-600 font-semibold mb-2">End User Credentials:</p>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-600">User ID:</span> user_{user?.credential?.userID}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-600">Password:</span> {user?.credential?.password}
                </p>
              </div>
            )
          }
          
            <Button
              label="Go to Login"
              type="Primary"
              className="w-48"
              onClick={handleGoToLogin}
            />
          </div>
          </div>
        <div className="w-full border-t bg-gray-50 rounded-b-md flex justify-center items-center h-[50px]">
          <p className="text-sm text-gray-600">M Strategy Group 2025. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default CredentialPage
