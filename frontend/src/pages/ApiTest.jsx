/**
 * API Connection Test Component
 * 
 * Use this component to verify your API integration
 * Add to App.jsx temporarily: <Route path="/api-test" element={<ApiTest />} />
 */

import { useState } from 'react';
import { 
  authService, 
  productService, 
  categoryService, 
  cartService 
} from '../services/api';
import useAuthStore from '../stores/authStore';

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const runTest = async (testName, testFn) => {
    setLoading(true);
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result.data }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          error: error.response?.data || error.message 
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const tests = {
    'Get Products': () => productService.getAll(),
    'Get Featured Products': () => productService.getFeatured(),
    'Get Categories': () => categoryService.getAll(),
    'Get Cart (requires auth)': () => cartService.get(),
    'Get Profile (requires auth)': () => authService.getProfile(),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="card p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">API Connection Test</h1>
          <p className="text-gray-600 mb-6">
            Test your Django REST API connection
          </p>

          {/* Auth Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold mb-2">Authentication Status</h2>
            <div className="text-sm">
              <p>Status: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✓ Authenticated' : '✗ Not Authenticated'}
              </span></p>
              {user && (
                <p>User: {user.email} ({user.first_name} {user.last_name})</p>
              )}
            </div>
          </div>

          {/* API Tests */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg mb-2">API Endpoints</h2>
            
            {Object.entries(tests).map(([name, testFn]) => (
              <div key={name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{name}</h3>
                  <button
                    onClick={() => runTest(name, testFn)}
                    disabled={loading}
                    className="btn-primary text-sm"
                  >
                    Test
                  </button>
                </div>

                {results[name] && (
                  <div className={`mt-2 p-3 rounded text-sm ${
                    results[name].success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {results[name].success ? (
                      <div>
                        <p className="text-green-700 font-medium mb-1">✓ Success</p>
                        <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
                          {JSON.stringify(results[name].data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p className="text-red-700 font-medium mb-1">✗ Error</p>
                        <pre className="text-xs overflow-auto bg-white p-2 rounded">
                          {JSON.stringify(results[name].error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Connection Info */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Configuration</h3>
            <p>API Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}</p>
            <p>Access Token: {localStorage.getItem('access_token') ? '✓ Present' : '✗ Missing'}</p>
            <p>Refresh Token: {localStorage.getItem('refresh_token') ? '✓ Present' : '✗ Missing'}</p>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="btn-outline text-sm"
            >
              Clear Storage & Reload
            </button>
            <button
              onClick={() => setResults({})}
              className="btn-ghost text-sm"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
