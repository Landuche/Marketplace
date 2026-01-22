import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/common/AuthLayout';
import InputField from '../components/common/InputField';
import SubmitBtn from '../components/common/SubmitBtn';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    if (!username) {
      toast.error('Username required');
      setLoading(false);
      return;
    }

    if (!password) {
      toast.error('Password required');
      setLoading(false);
      return;
    }

    const promise = api.post('token/', {
      username,
      password,
    });

    toast.promise(promise, {
      loading: 'Logging in...',
      success: 'Logged in successfully',
      error: () => {
        setError('Invalid username or password.');
        return 'Invalid username or password.';
      },
    });

    try {
      const response = await promise;

      if (response.status === 200) {
        login(response.data);
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `Login | Marketplace`;
  });

  return (
    <AuthLayout title='Login'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <InputField
          title='Username'
          placeholder='Enter your username'
          value={username}
          autoComplete='username'
          onChange={setUsername}
        />

        <InputField
          title='Password'
          type='password'
          placeholder='••••••••'
          value={password}
          autoComplete='current-password'
          onChange={setPassword}
        />

        {error && (
          <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'>
            <span className='font-medium text-red'>{error}</span>
          </div>
        )}

        <SubmitBtn loading={loading} text='Sign in' />
      </form>

      <p className='text-center text-sm text-gray-600 mt-6'>
        Don't have an account?{' '}
        <span
          onClick={() => navigate('/register')}
          className='text-blue-600 font-bold hover:underline cursor-pointer'
        >
          Sign up
        </span>
      </p>
    </AuthLayout>
  );
};

export default Login;
