import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // 2. Handle Escape Key
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200'>
      {/* Click outside to close */}
      <div className='absolute inset-0' onClick={onClose} />

      <div className='relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-in zoom-in-95 duration-200'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-bold text-gray-900'>{title}</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl'>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
