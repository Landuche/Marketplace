import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useState } from 'react';
import Modal from '../common/Modal';

const DeleteAccount = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    const promise = api.delete('users/me/');

    toast.promise(promise, {
      loading: 'Please wait...',
      success: () => {
        setIsModalOpen(false);
        logout();
        return 'Account deactivated.';
      },
      error: 'Error. Please try again.',
    });

    promise.finally(() => {
      setLoading(false);
      setIsModalOpen(false);
    });
  };

  return (
    <div className='space-y-6'>
      <h4 className='text-lg font-semibold text-gray-600'>
        Are you sure you want to delete your account?
      </h4>
      <p className='text-sm text-gray-600'>
        Once you delete your account, you have 30 days to recover it before all data is permanently
        deleted.
      </p>

      <button
        onClick={() => setIsModalOpen(true)}
        className='px-6 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition'
      >
        Delete
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title='Confirm Deletion'>
        <div className='space-y-4'>
          <p className='text-gray-600'>
            This will hide all your listings and disable your profile immediately.
          </p>
          <div className='flex space-x-3 mt-6'>
            <button
              disabled={loading}
              onClick={() => setIsModalOpen(false)}
              className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleDelete}
              className='flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:bg-red-400'
            >
              {loading ? 'Processing...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteAccount;
