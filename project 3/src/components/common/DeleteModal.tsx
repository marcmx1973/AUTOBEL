import { AlertTriangle } from 'lucide-react';

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dependencies?: { table: string; count: number; }[];
  itemName: string;
};

export default function DeleteModal({ isOpen, onClose, onConfirm, dependencies, itemName }: DeleteModalProps) {
  if (!isOpen) return null;

  const hasDependencies = dependencies && dependencies.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className={`h-6 w-6 ${hasDependencies ? 'text-red-500' : 'text-yellow-500'} mr-2`} />
            <h3 className="text-lg font-semibold">
              {hasDependencies ? 'Cannot Delete' : 'Confirm Delete'}
            </h3>
          </div>

          {hasDependencies ? (
            <>
              <p className="mb-4">
                The item "{itemName}" cannot be deleted because it is referenced in:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <ul className="list-disc list-inside space-y-1">
                  {dependencies.map((dep, index) => (
                    <li key={index} className="text-red-700">
                      {dep.table}: {dep.count} reference(s)
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-6">
                Are you sure you want to delete "{itemName}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}