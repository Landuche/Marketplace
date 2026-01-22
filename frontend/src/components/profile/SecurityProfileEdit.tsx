import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'sonner';
import { validateLength } from '../../utils/validator';

const SecurityProfileEdit = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [oldPassword, setoldPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please provide all the fields.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords must match.');
      setLoading(false);
      return;
    }

    if (!validateLength(newPassword, 7)) {
      toast.error('Password too short.');
      setLoading(false);
      return;
    }

    const promise = api.post('/users/change-password/', {
      new_password: newPassword,
      confirm_password: confirmPassword,
      old_password: oldPassword,
    });

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: () => {
        setoldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        return 'Password updated';
      },
      error: (error) => {
        if (error.response.data) setErrors(error.response.data);
        return 'Failed to update password.';
      },
    });

    promise.finally(() => setLoading(false));
  };

  return (
    <form className='space-y-6' onSubmit={handleSubmit}>
      <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
        <label className='text-sm font-semibold text-gray-700'>Old password</label>
        <input
          onChange={(e) => setoldPassword(e.target.value)}
          value={oldPassword}
          type='password'
          name='password'
          autoComplete='current-password'
          className='border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-[30ch]'
        />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
        <label className='text-sm font-semibold text-gray-700'>New password</label>
        <input
          onChange={(e) => setNewPassword(e.target.value)}
          value={newPassword}
          type='password'
          name='password'
          autoComplete='new-password'
          className='border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-[30ch]'
        />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
        <label className='text-sm font-semibold text-gray-700'>Confirm new password</label>
        <input
          onChange={(e) => setConfirmPassword(e.target.value)}
          type='password'
          value={confirmPassword}
          name='passwordConfirmation'
          autoComplete='new-password'
          className='border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition w-[30ch]'
        />
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

      <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-100'>
        <button
          disabled={loading}
          type='submit'
          className='px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md transition transform active:scale-95'
        >
          {loading ? 'Saving changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default SecurityProfileEdit;
