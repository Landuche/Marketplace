import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useParams } from 'react-router-dom';
import PaymentForm from '../components/payment/PaymentForm';
import api from '../services/api';
import type { OrderInterface } from '../interfaces/interfaces';
import { formatError, parseError } from '../utils/errors';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout: React.FC = () => {
  const [clientSecret, setClientSecret] = useState(null);
  const [order, setOrder] = useState<OrderInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { orderId } = useParams();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLoading(true);
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/order/${orderId}/`);
        setOrder(response.data);
        setClientSecret(response.data.client_secret);
      } catch (error) {
        const { errors, message } = parseError(error);
        console.error(message);
        setErrors(errors);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  if (!clientSecret || !orderId) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className='text-center p-8 bg-white rounded-xl shadow-md border border-red-100'>
          {Object.entries(errors).map(([field, messages]) => (
            <div
              key={field}
              className='mb-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'
            >
              <span className='capitalize font-bold'>
                {field === 'detail' || field === 'non_field_errors'
                  ? 'Error'
                  : field.replace('_', ' ')}
                :
              </span>
              <span className='ml-1'>{formatError(messages).join(' ')}</span>
            </div>
          )) || <p className='text-red-600 font-semibold'>No active checkout session found.</p>}
          <button
            onClick={() => (window.location.href = '/cart')}
            className='mt-4 text-indigo-600 hover:underline'
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret: clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        borderRadius: '12px',
        colorText: '#1f2937',
      },
    },
  };

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md mx-auto bg-white p-8 border border-gray-200 rounded-2xl shadow-sm'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
          Complete Your Purchase
        </h2>

        <div className='border-t pt-2 mt-2 flex justify-between font-bold text-xl text-blue-600'>
          <span>Total</span>
          <span>${order?.total_price}</span>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm orderId={orderId} />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;
