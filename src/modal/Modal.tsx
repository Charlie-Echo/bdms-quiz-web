import { useEffect } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children }:
    { isOpen: boolean, onClose: () => void , children: any }
) => {
  useEffect(() => {
    const handleEscape = (event: any) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        {children}
      </div>
    </div>
  );
};

export default Modal;