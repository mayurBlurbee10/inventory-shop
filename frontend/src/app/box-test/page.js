// src/app/box-test/page.js
'use client';

import { useState } from 'react';
import { fetchWrapper } from '../lib/fetchWrapper';

export default function Page() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWrapper('/api/box/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'thomas23@gmail.com',
          externalId: `test_user_${Date.now()}`
        }),
      }, 'create-user');
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Box User Creation Test</h1>
      
      <button
        onClick={createUser}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Box User'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <h3 className="font-bold mb-2">Created User:</h3>
          <pre className="whitespace-pre-wrap overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}