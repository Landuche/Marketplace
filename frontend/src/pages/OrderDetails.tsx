import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import type { OrderInterface, OrderItemInterface } from '../interfaces/interfaces';
import Modal from '../components/common/Modal';
import TrackingForm from '../components/listings/TrackingForm';
import { toast } from 'sonner';
import { formatError, parseError } from '../utils/errors';
import { getStatusStyles } from '../utils/formatters';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [shipItems, setShipItems] = useState<OrderItemInterface[] | null>(null);
  const [refundModal, setRefundModal] = useState<boolean>(false);
  const [searchParams] = useSearchParams();

  const groupedShipments = useMemo(() => {
    if (!order) return {};

    return order.items.reduce(
      (acc, item) => {
        const isShipped = !!item.tracking_code;
        const isCancelled = item.status === 'C';

        const key = isShipped
          ? `shipped-${item.tracking_code}`
          : isCancelled
            ? `cancelled-${item.seller_id}`
            : `pending-${item.seller_id}`;

        if (!acc[key]) {
          acc[key] = {
            tracking_code: item.tracking_code,
            seller_username: item.seller_username,
            seller_id: item.seller_id,
            status_display: item.status_display,
            is_shipped: isShipped,
            is_cancelled: isCancelled,
            items: [],
          };
        }

        acc[key].items.push(item);
        return acc;
      },
      {} as Record<string, any>
    );
  }, [order]);

  const isUnpaid = order?.status === 'P';

  const shipped = useMemo(() => order?.items.some((item) => !!item.tracking_code), [order]);

  useEffect(() => {
    const status = searchParams.get('redirect_status');
    if (status === 'succeeded') {
      toast.success('Payment successful');
      fetchOrder();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/order/${orderId}/`);
      setOrder(response.data);
    } catch (error) {
      const { errors, message } = parseError(error);
      setErrors(errors);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    setLoading(true);
    try {
      const response = await api.post(`order/${orderId}/refund/`);
      if (response.status == 204) fetchOrder();
    } catch (error) {
      const { errors, message } = parseError(error);
      setErrors(errors);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async (trackingCode: string, selectedIds: number[]) => {
    if (!shipItems) return;
    const promise = api.post(`/order/${orderId}/mark-shipped/`, {
      tracking_code: trackingCode,
      item_ids: selectedIds,
    });

    toast.promise(promise, {
      loading: 'Loading...',
      success: () => {
        fetchOrder();
        setShipItems(null);
        return 'Success';
      },
      error: (error) => {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      },
    });
  };

  if (loading || !order)
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
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Order Details</h1>
        <Link to='/orders' className='text-blue-600 hover:underline'>
          ← Back to Orders
        </Link>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left */}
        <div className='lg:col-span-2 space-y-6'>
          {Object.entries(groupedShipments).map(([groupKey, group]: [string, any]) => {
            const isCancelled = group.is_cancelled || order.status === 'C';
            const isShipped = group.is_shipped;
            const statusStyles = getStatusStyles(group.items[0].status); // Use item status

            return (
              <div
                key={groupKey}
                className='bg-white border rounded-xl overflow-hidden shadow-sm mb-6 transition-all hover:shadow-md'
              >
                <div className={`p-5 border-b ${isCancelled ? 'bg-red-50/50' : 'bg-gray-50/50'}`}>
                  <div className='flex justify-between items-start mb-6'>
                    <div>
                      <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1'>
                        Seller: {group.seller_username}
                      </p>
                      <h3 className='text-base font-bold text-gray-900'>
                        {isCancelled
                          ? 'Shipment Cancelled'
                          : isShipped
                            ? `Tracking: ${group.tracking_code}`
                            : 'Order Processing'}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyles}`}
                    >
                      {group.status_display}
                    </span>
                  </div>
                  {/* Enhanced Progress Bar */}
                  <div className='relative flex items-center justify-between w-full px-1'>
                    <div className='absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full -z-0'></div>
                    <div
                      className={`absolute left-0 top-1/2 h-1 transition-all duration-700 ease-out -translate-y-1/2 rounded-full -z-0 ${
                        isCancelled
                          ? 'bg-red-400'
                          : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                      }`}
                      style={{ width: isShipped ? '100%' : '50%' }}
                    ></div>

                    {/* Step 1: Ordered */}
                    <div className='relative z-10 flex flex-col items-center'>
                      <div
                        className={`w-4 h-4 rounded-full border-4 border-white shadow-sm ${isCancelled ? 'bg-red-500' : 'bg-blue-600'}`}
                      ></div>
                      <span className='absolute top-6 text-[10px] font-bold text-gray-500 uppercase'>
                        Paid
                      </span>
                    </div>

                    {/* Step 2: Shipped */}
                    <div className='relative z-10 flex flex-col items-center'>
                      <div
                        className={`w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                          isShipped ? (isCancelled ? 'bg-red-500' : 'bg-blue-600') : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className='absolute top-6 text-[10px] font-bold text-gray-500 uppercase'>
                        {isCancelled ? 'Cancelled' : 'Shipped'}
                      </span>
                    </div>
                  </div>
                  <div className='h-8'></div> {/* Spacer for the absolute labels */}
                </div>

                {/* Items List */}
                <div className='p-6 divide-y'>
                  {group.items.map((item: OrderItemInterface) => (
                    <div
                      key={item.id}
                      className='py-4 first:pt-0 last:pb-0 flex items-center gap-4'
                    >
                      <img
                        src={
                          item.listing_image ||
                          'https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available'
                        }
                        alt={item.listing_title}
                        className='w-16 h-16 object-cover rounded-lg border'
                      />
                      <div className='flex-1'>
                        <p>{item.listing_title}</p>
                        <p className='text-sm'>x{item.quantity}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-gray-900'>${item.listing_price}</p>
                        <p className={`text-xs ${isCancelled ? 'text-red-500' : 'text-gray-400'}`}>
                          {item.status_display}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seller Action */}
                {order.user_role === 'seller' && !group.is_shipped && order.status === 'A' && (
                  <div className='p-4 bg-blue-50 border-t flex items-center justify-between'>
                    <span className='text-sm text-blue-800 font-medium font-bold'>
                      Awaiting shipment
                    </span>
                    <button
                      onClick={() => setShipItems(group.items)}
                      className='bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all'
                    >
                      Ship Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right */}
        <div className='space-y-6'>
          <div className='bg-gray-50 border rounded-xl p-6'>
            <h2 className='text-lg font-bold mb-4'>Order Summary</h2>

            <div className='space-y-3 mb-4'>
              {order.items.map((item: OrderItemInterface) => (
                <div key={item.id} className='flex justify-between text-sm text-gray-600'>
                  <span className='truncate max-w-[150px]'>{item.listing_title}</span>
                  <span>
                    ${item.listing_price}{' '}
                    <span className='text-xs text-gray-400 font-medium'>x{item.quantity}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className='border-t pt-4 space-y-2'>
              <div className='pt-3 mt-2 flex justify-between font-bold text-xl text-blue-600'>
                <span>Total</span>
                <span>${order.total_price}</span>
              </div>
            </div>

            {/* REPAY SECTION */}
            {order.user_role === 'buyer' && isUnpaid && order.client_secret && (
              <div className='mt-8 pt-8 border-t'>
                <h3 className='text-md font-bold text-gray-900 mb-4'>Pending Payment</h3>
                <Link
                  to={`/checkout/${orderId}`}
                  className='flex items-center justify-center text-center w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200'
                >
                  Pay Now
                </Link>
              </div>
            )}

            {/* REFUND */}
            {order.user_role === 'buyer' && !shipped && order.status === 'A' && (
              <div className='mt-8 pt-8 border-t'>
                <h3 className='text-md font-bold text-gray-900 mb-4'>Refund Order</h3>
                <button
                  onClick={() => setRefundModal(true)}
                  className='flex items-center justify-center text-center w-full mt-6 bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200'
                >
                  Refund
                </button>
              </div>
            )}
            {shipped && order.status === 'A' && (
              <h3 className='text-sm text-gray-600'>Refund not available.</h3>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={!!shipItems} onClose={() => setShipItems(null)} title='Confirm Shipment'>
        {shipItems && <TrackingForm items={shipItems} onConfirm={handleMarkShipped} />}
      </Modal>

      <Modal isOpen={refundModal} onClose={() => setRefundModal(false)} title='Confirm Refund'>
        <div className='space-y-4'>
          <p className='text-gray-600'>Are you sure you want to refund?</p>
          <div className='flex space-x-3 mt-6'>
            <button
              disabled={loading}
              onClick={() => setRefundModal(false)}
              className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition'
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={() => {
                setRefundModal(false);
                handleRefund();
              }}
              className='flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:bg-red-400'
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;
