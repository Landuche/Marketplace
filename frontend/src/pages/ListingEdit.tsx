import { useEffect, useState } from 'react';
import type { ListingImageInterface, ListingInterface } from '../interfaces/interfaces';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import SubmitBtn from '../components/common/SubmitBtn';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { formatError, parseError } from '../utils/errors';
import Modal from '../components/common/Modal';
import { validateImage, validateLength } from '../utils/validator';
import { v4 as uuidv4 } from 'uuid';

interface ImageState extends Partial<ListingImageInterface> {
  isNew: boolean;
  file?: File;
}

const ListingEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingInterface | null>(null);
  const [editedListing, setEditedListing] = useState<ListingInterface | null>(null);
  const [preview, setPreview] = useState<ImageState[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!editedListing?.title) {
      toast.error('Listing title required');
      setLoading(false);
      return;
    }

    if (!validateLength(editedListing.title, 2)) {
      toast.error('Listing title too short');
      setLoading(false);
      return;
    }

    if (!editedListing?.price) {
      toast.error('Listing price required');
      setLoading(false);
      return;
    }

    if (Number(editedListing.price) < 0) {
      toast.error('Price must be positive');
      setLoading(false);
      return;
    }

    const delta = new FormData();

    Object.keys(editedListing).forEach((key) => {
      const k = key as keyof ListingInterface;
      if (listing && listing[k] !== editedListing[k]) {
        if (k === 'available_stock') return;
        delta.append(k, String(editedListing[k]));
      }
    });

    const mainImage = preview.find((img) => img.is_main);
    if (mainImage && !mainImage.isNew && mainImage.id) {
      const original = listing?.images?.find((img) => img.is_main);
      if (original && original.id != mainImage.id) {
        delta.append('main_image_id', mainImage.id);
      }
    }

    for (const [index, img] of preview.entries()) {
      if (img.isNew && img.file) {
        const { result, message } = validateImage(img.file);
        if (!result) {
          toast.error(`Error on ${index + 1} image: ${message}`);
          setLoading(false);
          return;
        }
        delta.append(`image_${img.id}`, img.file);
      }
    }

    const manifest = preview
      .filter((img) => img.isNew)
      .map((img) => ({
        key: `image_${img.id}`,
        isMain: img.is_main,
      }));

    if (manifest.length > 0) {
      delta.append('manifest', JSON.stringify(manifest));
    }

    if (deletedImages.length > 0) {
      delta.append('deleted_images', JSON.stringify(deletedImages));
    }

    if (delta.entries().next().done) {
      toast.info('No changes detected.');
      setLoading(false);
      return;
    }

    const promise = api.patch(`/listings/${id}/`, delta);

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: () => {
        navigate(`/listings/${id}`);
        return 'Listing updated successfully';
      },
      error: (error) => {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      },
    });

    promise.finally(() => setLoading(false));
  };

  const handleMain = (id: string | undefined) => {
    if (id) setPreview((prev) => prev.map((img) => ({ ...img, is_main: img.id === id })));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    setEditedListing((prevData) => {
      if (!prevData) return null;
      return { ...prevData, [name]: value };
    });
  };

  const handleQuantity = (subtract: boolean = false) => {
    if (!editedListing) return;
    let { quantity } = editedListing;
    const value = subtract ? quantity - 1 : quantity + 1;
    if (value < 0) return;
    setEditedListing({ ...editedListing, quantity: value });
  };

  const handlePreviews = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);

      setPreview((prev) => {
        const hasMain = prev.some((img) => img.is_main);
        const newItems: ImageState[] = files.map((file, index) => ({
          id: uuidv4(),
          image: URL.createObjectURL(file),
          is_main: !hasMain && index === 0,
          file: file,
          isNew: true,
        }));
        return [...prev, ...newItems];
      });
    }
  };

  const removeImage = (id: string) => {
    const image = preview.find((img) => img.id == id);
    if (!image) return;

    setPreview((prev) => {
      const filtered = prev.filter((img) => img.id != id);

      if (image.is_main && filtered.length > 0) {
        return filtered.map((img, index) => (index === 0 ? { ...img, is_main: true } : img));
      }
      return filtered;
    });

    if (image.image) URL.revokeObjectURL(image.image);
    if (!image.isNew) setDeletedImages((prev) => [...prev, id]);
  };

  const handleDelete = async () => {
    setLoading(true);

    const promise = api.post(`/listings/${id}/soft-delete/`);

    toast.promise(promise, {
      loading: 'Please wait...',
      success: (response) => {
        if (response.data.is_active) {
          navigate(`/listings/${id}`);
          return 'Listing reactivated successfully';
        } else {
          navigate('/');
          return 'Listing deactivated successfully';
        }
      },
      error: (error) => {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      },
    });

    promise.finally(() => setLoading(false));
  };

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/listings/${id}/`);

        if (user?.id != response.data.seller.id) {
          toast.error('Access denied');
          navigate(`/listings/${id}/`);
          return;
        }

        setListing(response.data);
        setEditedListing(response.data);

        if (response.data.images) {
          setPreview(
            response.data.images.map((img: ImageState) => ({
              ...img,
              url: img.image,
              isNew: false,
            }))
          );
        }
      } catch (error: any) {
        const status = error.response?.status;

        if (status === 404) {
          navigate('/');
          toast.error('Listing not found');
        } else if (status === 403) {
          navigate(`/listings/${id}/`);
          toast.error('Unauthorized');
        } else {
          navigate(`/`);
          toast.error('Unexpected error');
        }
      } finally {
        setLoading(false);
      }
    };

    document.title = `Edit Listing | Marketplace`;
    fetchListing();
  }, []);

  useEffect(() => {
    return () => {
      preview.forEach((img) => {
        if (img.image) URL.revokeObjectURL(img.image);
      });
    };
  }, [preview]);

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  return (
    <div className='max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100'>
      <h2 className='text-3xl font-bold text-gray-900 mb-8'>Edit your Listing</h2>

      <form className='space-y-6' onSubmit={handleSubmit}>
        <div className='space-y-4'>
          <label className='block text-sm font-medium text-gray-700'>Images</label>
          <div className='flex flex-wrap gap-4'>
            <label htmlFor='images' className='w-30 h-30 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all'>
              <span className='text-2xl text-gray-400'>+</span>
              <span className='text-xs text-gray-400'>Add Photo</span>
              <input
                name='images'
                id='images'
                type='file'
                multiple
                className='hidden'
                onChange={handlePreviews}
                accept='image/*'
              />
            </label>

            {preview.map((img, index) => (
              <div key={img.id} className='relative w-30 h-30'>
                <img
                  src={img.image}
                  onClick={() => handleMain(img.id)}
                  className='w-full h-full object-cover rounded-xl'
                  alt={`Preview ${index}`}
                />
                {img.is_main && (
                  <span className='absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-2 rounded-md'>
                    Main
                  </span>
                )}
                <button
                  type='button'
                  onClick={() => {
                    if (img.id) removeImage(img.id);
                  }}
                  className='absolute top-2 right-1 bg-red-600 text-white text-[10px] px-2 rounded-md'
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-1 italic'>
            Listing Title
          </label>
          <input
            id='title'
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            type='text'
            name='title'
            placeholder={listing?.title}
            value={editedListing?.title}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>

        <div>
          <label htmlFor='description' className='block test-sm font-medium text-gray-700 mb-1 italic'>Description</label>
          <textarea
            id='description'
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32'
            placeholder={listing?.description || 'Listing Description'}
            name='description'
            value={editedListing?.description}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>

        <div>
          <label htmlFor='price' className='block text-sm font-medium text-gray-700 mb-1 italic'>
            Listing Price
          </label>
          <input
            id='price'
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            type='number'
            name='price'
            placeholder={String(listing?.price)}
            value={editedListing?.price}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='quantity' className='block text-sm font-medium text-gray-700 mb-1 italic'>Quantity</label>
          <div className='relative flex items-center max-w-[150px]'>
            <button
              type='button'
              onClick={() => handleQuantity(true)}
              className='absolute left-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
            >
              −
            </button>
            <input
              id='quantity'
              type='number'
              value={editedListing?.quantity}
              onChange={(e) => {
                handleChange(e);
              }}
              name='quantity'
              className='w-full text-center bg-gray-50 border border-gray-200 py-3 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
            <button
              type='button'
              onClick={() => handleQuantity()}
              className='absolute right-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
            >
              +
            </button>
          </div>
          <div className='flex justify-between text-xs text-gray-500 px-1'>
            <span>Total Inventory: {editedListing?.quantity}</span>
            <span className='text-orange-600 font-medium'>
              Currently Reserved: {(listing?.quantity ?? 0) - (listing?.available_stock ?? 0)}
            </span>
          </div>
        </div>

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
        ))}

        <SubmitBtn text='Save Changes' loading={loading} />

        <button
          type='button'
          disabled={loading}
          onClick={() => (listing?.is_active ? setIsModalOpen(true) : handleDelete())}
          className={`w-full font-semibold py-3 rounded-xl transition-all shadow-lg text-white
                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
        >
          {' '}
          {listing?.is_active ? 'Delete Listing' : 'Activate Listing'}
        </button>
      </form>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title='Confirm Deletion'>
        <div className='space-y-4'>
          <p className='text-gray-600'>
            This will disable your listing for 30 days before permanently deleting it.
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

export default ListingEdit;