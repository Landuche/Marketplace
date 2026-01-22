import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Props {
  orderId: string;
}

const PaymentForm: React.FC<Props> = ({ orderId }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${orderId}`,
      },
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? 'An unexpected error occurred.');
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='p-3 border border-gray-100 rounded-lg bg-gray-50'>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
          {errorMessage}
        </div>
      )}

      <button
        disabled={isProcessing || !stripe || !elements}
        className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
      >
        {isProcessing ? (
          <span className='flex items-center'>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>
    </form>
  );
};

export default PaymentForm;
