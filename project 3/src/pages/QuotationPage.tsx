import { useState, useEffect } from 'react';
import { Pencil, Trash2, MessageSquare, ArrowUpDown } from 'lucide-react';
import { fetchRFQs, deleteRFQ, fetchRFQComments, type RFQComment } from '../lib/supabase';
import EditRFQModal from '../components/EditRFQModal';
import CommentModal from '../components/CommentModal';
import { STATUS_COLORS } from '../constants';

type RFQ = {
  id: string;
  reference: string;
  opportunity: string;
  customer: string;
  program: string;
  phase_status: string;
  due_date: string;
  created_at: string;
  rfq_planning: any[];
  rfq_worksharing: any[];
  lastComment?: RFQComment;
};

type SortConfig = {
  key: keyof RFQ;
  direction: 'asc' | 'desc';
} | null;

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rfqReference: string;
};

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, rfqReference }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir supprimer le devis "{rfqReference}" ? Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuotationPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    rfqId: string | null;
    rfqReference: string;
  }>({
    isOpen: false,
    rfqId: null,
    rfqReference: ''
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    rfqId: string | null;
  }>({
    isOpen: false,
    rfqId: null
  });
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    rfqId: string | null;
    rfqReference: string;
    comments: RFQComment[];
  }>({
    isOpen: false,
    rfqId: null,
    rfqReference: '',
    comments: []
  });

  const loadRFQs = async () => {
    try {
      setLoading(true);
      const data = await fetchRFQs();
      
      // Fetch last comment for each RFQ
      const rfqsWithComments = await Promise.all(
        data.map(async (rfq) => {
          const comments = await fetchRFQComments(rfq.id);
          return {
            ...rfq,
            lastComment: comments[0] // Get the most recent comment
          };
        })
      );
      
      setRfqs(rfqsWithComments);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setError('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRFQs();
  }, []);

  const handleEdit = (rfqId: string) => {
    setEditModal({
      isOpen: true,
      rfqId
    });
  };

  const handleDelete = (rfqId: string, reference: string) => {
    setDeleteModal({
      isOpen: true,
      rfqId,
      rfqReference: reference
    });
  };

  const handleOpenComments = async (rfqId: string, reference: string) => {
    try {
      const comments = await fetchRFQComments(rfqId);
      setCommentModal({
        isOpen: true,
        rfqId,
        rfqReference: reference,
        comments
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentAdded = async () => {
    if (commentModal.rfqId) {
      const comments = await fetchRFQComments(commentModal.rfqId);
      setCommentModal(prev => ({ ...prev, comments }));
      loadRFQs(); // Reload RFQs to update last comment
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.rfqId) return;

    try {
      await deleteRFQ(deleteModal.rfqId);
      await loadRFQs();
      setDeleteModal({ isOpen: false, rfqId: null, rfqReference: '' });
    } catch (err) {
      console.error('Error deleting RFQ:', err);
      setError('Erreur lors de la suppression du devis');
    }
  };

  const handleSort = (key: keyof RFQ) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedRFQs = [...rfqs].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];

    // Handle date fields
    if (key === 'due_date' || key === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key: keyof RFQ) => {
    if (sortConfig?.key === key) {
      return (
        <ArrowUpDown 
          size={16} 
          className={`inline ml-1 transform ${
            sortConfig.direction === 'desc' ? 'rotate-180' : ''
          }`} 
        />
      );
    }
    return <ArrowUpDown size={16} className="inline ml-1 text-gray-300" />;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Quotation Funnel
            </h1>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        { key: 'reference', label: 'Reference' },
                        { key: 'opportunity', label: 'Opportunity' },
                        { key: 'customer', label: 'Customer' },
                        { key: 'program', label: 'Program' },
                        { key: 'phase_status', label: 'Status' },
                        { key: 'due_date', label: 'Due Date' },
                        { key: 'rfq_planning', label: 'Planning' },
                        { key: 'rfq_worksharing', label: 'Worksharing' }
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(key as keyof RFQ)}
                        >
                          <div className="flex items-center">
                            {label}
                            {getSortIcon(key as keyof RFQ)}
                          </div>
                        </th>
                      ))}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Comment
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedRFQs.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rfq.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.opportunity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[rfq.phase_status as keyof typeof STATUS_COLORS]}`}>
                            {rfq.phase_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.rfq_planning?.length || 0} étapes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rfq.rfq_worksharing?.length || 0} lignes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {rfq.lastComment ? (
                            <div className="flex items-center space-x-2">
                              <span className="truncate">{rfq.lastComment.comment}</span>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                ({new Date(rfq.lastComment.created_at).toLocaleDateString()})
                              </span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenComments(rfq.id, rfq.reference)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                            title="Comments"
                          >
                            <MessageSquare size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(rfq.id)}
                            className="text-emerald-600 hover:text-emerald-900 mr-4"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(rfq.id, rfq.reference)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, rfqId: null, rfqReference: '' })}
        onConfirm={confirmDelete}
        rfqReference={deleteModal.rfqReference}
      />

      {editModal.isOpen && editModal.rfqId && (
        <EditRFQModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, rfqId: null })}
          rfqId={editModal.rfqId}
          onUpdate={loadRFQs}
        />
      )}

      {commentModal.isOpen && commentModal.rfqId && (
        <CommentModal
          isOpen={commentModal.isOpen}
          onClose={() => setCommentModal({ isOpen: false, rfqId: null, rfqReference: '', comments: [] })}
          rfqId={commentModal.rfqId}
          rfqReference={commentModal.rfqReference}
          comments={commentModal.comments}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}