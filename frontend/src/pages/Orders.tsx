import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import type { OrderInterface } from '../interfaces/interfaces';
import { formatError, parseError } from '../utils/errors';
import { getStatusStyles } from '../utils/formatters';

const Orders = () => {
  const [orders, setOrders] = useState<OrderInterface[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<'buyer' | 'seller'>('buyer');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/order/?view=${mode}`);
      setOrders(response.data);
    } catch (error) {
      const { errors, message } = parseError(error);
      console.error(message);
      setErrors(errors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Orders | Marketplace';
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [mode]);

  if (loading || !orders)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  return (
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
      {Object.entries(errors).map(([field, messages]) => (
        <div
          key={field}
          className='mb-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'
        >
          <span className='capitalize font-bold'>
            {field === 'detail' || field === 'non_field_errors' ? 'Error' : field.replace('_', ' ')}
            :
          </span>
          <span className='ml-1'>{formatError(messages).join(' ')}</span>
        </div>
      ))}
      <div className='inline-flex p-1 bg-gray-100 rounded-xl mb-8'>
        <button
          onClick={() => setMode('buyer')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'buyer'
              ? 'bg-white shadow-sm text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Buying
        </button>
        <button
          onClick={() => setMode('seller')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'seller'
              ? 'bg-white shadow-sm text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Selling
        </button>
      </div>
      <div className='space-y-6'>
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className='bg-white border rounded-lg shadow-sm overflow-hidden'>
              {/* Order Header */}
              <div className='bg-gray-50 p-4 border-b flex justify-between items-center'>
                <div className='flex gap-6 text-sm text-gray-600'>
                  <div>
                    <p className='uppercase font-semibold text-xs text-gray-400'>Order Placed</p>
                    <p>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className='uppercase font-semibold text-xs text-gray-400'>Total</p>
                    <p className='font-medium text-gray-900'>${order.total_price}</p>
                  </div>
                  <div>
                    <p className='uppercase font-semibold text-xs text-gray-400'>Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(order.status)}`}
                    >
                      {order.status_display}
                    </span>
                  </div>
                </div>
                <p className='text-xs text-gray-400 font-mono'>ID: {order.id.split('-')[0]}</p>
              </div>

              {/* Order Items */}
              <div className='p-4 flex justify-between items-end bg-white'>
                <div className='space-y-4 flex-1'>
                  {order.items.map((item) => (
                    <div key={item.id} className='flex gap-4 items-center'>
                      <img
                        src={
                          item.listing_image
                            ? item.listing_image
                            : 'https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available'
                        }
                        alt={item.listing_title}
                        className='w-16 h-16 object-cover rounded shadow-sm'
                      />
                      <div className='flex-1'>
                        {item.listing_is_active ? (
                          <Link
                            to={`/listings/${item.listing_id}`}
                            className='font-medium text-gray-900 line-clamp-1'
                          >
                            {item.listing_title}
                          </Link>
                        ) : (
                          <h3 className='font-medium text-gray-900 line-clamp-1'>
                            {item.listing_title}
                          </h3>
                        )}
                        <p className='text-sm text-gray-500'>
                          Qty: {item.quantity} • ${item.listing_price} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='ml-4 flex-shrink-0'>
                  <Link
                    to={`/order/${order.id}`}
                    className='text-blue-600 text-sm font-medium hover:underline flex items-center whitespace-nowrap bg-blue-50 px-3 py-2 rounded-lg'
                  >
                    View Order →
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200'>
            <div className='mb-4 text-4xl'>📦</div>
            <p className='text-gray-900 font-bold text-lg'>No orders found</p>
            <p className='text-gray-500 mb-6'>
              Looks like you haven't {mode === 'buyer' ? 'bought' : 'sold'} anything yet.
            </p>
            <Link
              to={mode === 'buyer' ? '/' : '/create-listing'}
              className='inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors'
            >
              {mode === 'buyer' ? 'Start Shopping' : 'Create a Listing'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
