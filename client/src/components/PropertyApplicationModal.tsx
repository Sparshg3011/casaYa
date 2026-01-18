'use client';

import { Dialog } from '@headlessui/react';
import ApplicationForm from './ApplicationForm';

interface PropertyApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess?: () => void;
}

export default function PropertyApplicationModal({
  isOpen,
  onClose,
  propertyId,
  onSuccess
}: PropertyApplicationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-2xl shadow-xl">
          <ApplicationForm
            propertyId={propertyId}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 