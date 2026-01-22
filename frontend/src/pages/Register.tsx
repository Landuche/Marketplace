import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/common/AuthLayout';
import SubmitBtn from '../components/common/SubmitBtn';
import type { LocationInterface, UserInterface } from '../interfaces/interfaces';
import { toast } from 'sonner';
import { parseError } from '../utils/errors';
import LocationInput from '../components/location/LocationInput';
import { validateImage, validateLength } from '../utils/validator';

interface RegisterInterface extends Omit<
  UserInterface,
  'id' | 'created_at' | 'latitude' | 'longitude'
> {
  password: string;
  password_confirmation: string;
  latitude: number | null;
  longitude: number | null;
}

interface ImageInterface {
  image: string;
  file: File;
}

const Register = () => {
  const [user, setUser] = useState<RegisterInterface>({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    location: '',
    city: '',
    latitude: null,
    longitude: null,
  });
  const [profilePicture, setProfilePicture] = useState<ImageInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (profilePicture) URL.revokeObjectURL(profilePicture.image);
      setProfilePicture({ file: file, image: URL.createObjectURL(file) });
    }
  };

  const handleLocation = (locationData: LocationInterface) => {
    setUser((prev) => ({
      ...prev,
      ...locationData,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!user.username) {
      toast.error('Username required.');
      setLoading(false);
      return;
    }

    if (!validateLength(user.username, 2)) {
      toast.error('Username too short.');
      setLoading(false);
      return;
    }

    if (!user.email) {
      toast.error('Email required');
      setLoading(false);
      return;
    }

    if (!user.password || !user.password_confirmation) {
      toast.error('Please inform your password');
      setLoading(false);
      return;
    }

    if (!validateLength(user.password, 7)) {
      toast.error('Password too short.');
      setLoading(false);
      return;
    }

    if (user.password != user.password_confirmation) {
      toast.error('Passwords dont match');
      setLoading(false);
      return;
    }

    if (!user.location || !user.city || !user.latitude || !user.longitude) {
      toast.error('Please select a valid address');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    Object.keys(user).forEach((key) => {
      const k = key as keyof RegisterInterface;
      formData.append(k, String(user[k]));
    });

    if (profilePicture && profilePicture.file instanceof File) {
      const { result, message } = validateImage(profilePicture.file);
      if (!result) {
        toast.error(message);
        setLoading(false);
        return;
      }
      formData.append('profile_picture', profilePicture.file);
    }

    const promise = api.post('/register/', formData);

    toast.promise(promise, {
      loading: 'Creating account...',
      success: async () => {
        const token = await api.post('/token/', {
          username: user.username,
          password: user.password,
        });

        login(token.data);
        navigate('/');
        return 'Account created successfully';
      },
      error: (error) => {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      },
    });

    promise.finally(() => setLoading(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  useEffect(() => {
    document.title = `Register | Marketplace`;
  }, []);

  useEffect(() => {
    return () => {
      if (profilePicture?.image) URL.revokeObjectURL(profilePicture.image);
    };
  }, [profilePicture]);

  return (
    <AuthLayout title='Register'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='flex flex-col items-center mb-6'>
          <div className='w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-500 flex items-center justify-center shadow-inner'>
            {profilePicture ? (
              <img
                src={profilePicture.image}
                alt='Preview'
                className='w-full h-full object-cover'
              />
            ) : (
              <span className='text-gray-400 text-xs text-center px-2'>No Photo</span>
            )}
          </div>

          <label className='cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors'>
            Choose Profile Picture
            <input type='file' className='hidden' accept='image/*' onChange={handleImagePreview} />
          </label>
        </div>

        <div>
          <div className='flex flex-col space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>Username</label>
            <input
              type='text'
              name='username'
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
              placeholder={user?.username}
              value={user?.username}
              autoComplete='username'
              onChange={(e) => {
                handleChange(e);
              }}
            />
          </div>
        </div>

        <div>
          <div className='flex flex-col space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>Email</label>
            <input
              type='text'
              name='email'
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
              placeholder={user?.email}
              value={user?.email}
              autoComplete='email'
              onChange={(e) => {
                handleChange(e);
              }}
            />
          </div>
        </div>

        <div>
          <div className='flex flex-col space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>Password</label>
            <input
              type='password'
              name='password'
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
              placeholder={user?.password}
              value={user?.password}
              autoComplete='new-password'
              onChange={(e) => {
                handleChange(e);
              }}
            />
          </div>
        </div>

        <div>
          <div className='flex flex-col space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>Password Confirmation</label>
            <input
              type='password'
              name='password_confirmation'
              className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
              placeholder={user?.password_confirmation}
              value={user?.password_confirmation}
              autoComplete='new-password'
              onChange={(e) => {
                handleChange(e);
              }}
            />
          </div>
        </div>

        <div>
          <label className='text-sm font-semibold text-gray-700'>Location</label>
          <LocationInput selectedLocation={handleLocation} />
        </div>

        {Object.keys(errors).length > 0 && (
          <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'>
            <p className='font-bold mb-1'>Please correct the following errors:</p>
            <ul className='list-disc list-inside'>
              {Object.entries(errors).map(([field, messages]) => (
                <li key={field}>
                  <span className='capitalize font-medium'>{field.replace('_', ' ')}</span>:{' '}
                  {messages.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SubmitBtn loading={loading} text='Register' />
      </form>

      <p className='text-center text-sm text-gray-600 mt-6'>
        Already have an account?{' '}
        <span
          onClick={() => navigate('/login')}
          className='text-blue-600 font-bold hover:underline cursor-pointer'
        >
          Login
        </span>
      </p>
    </AuthLayout>
  );
};

export default Register;
