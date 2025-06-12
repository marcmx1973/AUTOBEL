import { useState, useEffect } from 'react';
import { Calendar, MessageSquarePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EditRFQModal from '../components/EditRFQModal';
import { STATUS_COLORS, TEAMS } from '../constants';
import type { RFQ } from '../types';
import CommentModal from '../components/CommentModal';

const STATUS_CARDS = [
  { status: 'PROSPECT', label: 'Prospect', color: 'bg-purple-100' },
  { status: 'PROPOSAL', label: 'Proposal', color: 'bg-blue-100' },
  { status: 'NEGOTIATION', label: 'Negotiation', color: 'bg-yellow-100' },
  { status: 'STANDBY', label: 'Standby', color: 'bg-orange-100' },
  { status: 'OTHER', label: 'Other', color: 'bg-gray-100' }
];

export default function WeeklyReviewPage() {
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeek());
  const [selectedStatus, setSelectedStatus] = useState<string>('PROSPECT');
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    rfqId: string | null;
    rfqReference: string;
    comments: any[];
  }>({
    isOpen: false,
    rfqId: null,
    rfqReference: '',
    comments: []
  });

  const weekDates = getWeekDates(selectedWeek);

  useEffect(() => {
    loadRFQs();
  }, [selectedWeek]);

  const loadRFQs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfq')
        .select(`
          *,
          rfq_planning (*),
          rfq_worksharing (*),
          rfq_comments (*)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      console.error('Error loading RFQs:', error);
    }
  };

  const filteredRfqs = rfqs.filter(rfq => {
    if (selectedStatus === 'OTHER') {
      return !['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'STANDBY'].includes(rfq.phase_status);
    }
    return rfq.phase_status === selectedStatus;
  });

  const getCurrentTeam = (rfq: RFQ) => {
    const teamOrder = ['BLU', 'PIN', 'EOQ', 'GRE', 'RED'];
    const planning = rfq.rfq_planning || [];
    
    for (const team of teamOrder) {
      const teamPlanning = planning.find(p => p.team === team);
      if (teamPlanning && !teamPlanning.actual_date) {
        return {
          name: team,
          date: teamPlanning.planned_date
        };
      }
    }
    
    return null;
  };

  const getStatusCount = (status: string) => {
    if (status === 'OTHER') {
      return rfqs.filter(rfq => !['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'STANDBY'].includes(rfq.phase_status)).length;
    }
    return rfqs.filter(rfq => rfq.phase_status === status).length;
  };

  const handleOpenComments = async (rfqId: string, reference: string) => {
    try {
      const { data: comments } = await supabase
        .from('rfq_comments_with_users')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      setCommentModal({
        isOpen: true,
        rfqId,
        rfqReference: reference,
        comments: comments || []
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const renderRFQCard = (rfq: RFQ) => {
    const currentTeam = getCurrentTeam(rfq);
    const lastComment = rfq.rfq_comments?.[0];
    const daysLeft = rfq.due_date 
      ? Math.ceil((new Date(rfq.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div 
        key={rfq.id} 
        className={`${STATUS_COLORS[rfq.phase_status as keyof typeof STATUS_COLORS]} p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md mb-4 ${
          selectedRFQ === rfq.id ? 'ring-2 ring-red-500 border-2 border-red-500 shadow-lg scale-[1.02]' : ''
        }`}
        onClick={() => setSelectedRFQ(rfq.id)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">{rfq.reference}</h3>
              <span className="text-lg font-semibold">- {rfq.opportunity}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{rfq.customer} | {rfq.program}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Due: {new Date(rfq.due_date).toLocaleDateString('fr-FR')}</p>
            {daysLeft !== null && (
              <p className={`text-sm font-medium ${daysLeft < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {daysLeft} days left
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-2">
            {currentTeam && (
              <span className={`text-sm ${TEAMS[currentTeam.name as keyof typeof TEAMS].color}`}>
                Next: {TEAMS[currentTeam.name as keyof typeof TEAMS].name}
                {currentTeam.date && ` (${new Date(currentTeam.date).toLocaleDateString('fr-FR')})`}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {rfq.internal_customer && (
              <span className="text-sm bg-white px-2 py-1 rounded">
                IC: {rfq.internal_customer}
              </span>
            )}
            {rfq.proposal_leader && (
              <span className="text-sm bg-white px-2 py-1 rounded">
                PL: {rfq.proposal_leader}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenComments(rfq.id, rfq.reference);
              }}
              className="flex-shrink-0 text-gray-600 hover:text-gray-900 mr-3"
            >
              <MessageSquarePlus size={16} />
            </button>
            {lastComment ? (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {lastComment.comment}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  ({new Date(lastComment.created_at).toLocaleDateString('fr-FR')})
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">No comments yet</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-100 flex">
      {/* Sidebar - 15% width */}
      <div className={`${isSidebarOpen ? 'w-[15%]' : 'w-20'} bg-white shadow-lg flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Weekly Review</h2>
          </div>
          <div className="mt-4">
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              {weekDates.start} - {weekDates.end}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {STATUS_CARDS.map(({ status, label, color }) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`w-full mb-4 p-4 rounded-lg transition-transform hover:scale-105 ${
                selectedStatus === status ? 'ring-2 ring-emerald-500' : ''
              } ${color}`}
            >
              <h3 className="text-lg font-medium">{label}</h3>
              <p className="mt-2 text-3xl font-semibold">{getStatusCount(status)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - 35% width */}
      <div className="w-[35%] overflow-y-auto">
        <div className="ml-[5mm] py-6 pr-4">
          {filteredRfqs.map(rfq => renderRFQCard(rfq))}
        </div>
      </div>

      {/* Edit Form Panel - 50% width */}
      <div 
        className={`fixed inset-y-0 right-0 w-[50%] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedRFQ ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedRFQ && (
          <EditRFQModal
            isOpen={true}
            onClose={() => setSelectedRFQ(null)}
            rfqId={selectedRFQ}
            onUpdate={loadRFQs}
          />
        )}
      </div>

      {/* Comment Modal */}
      {commentModal.isOpen && commentModal.rfqId && (
        <CommentModal
          isOpen={commentModal.isOpen}
          onClose={() => setCommentModal({ isOpen: false, rfqId: null, rfqReference: '', comments: [] })}
          rfqId={commentModal.rfqId}
          rfqReference={commentModal.rfqReference}
          comments={commentModal.comments}
          onCommentAdded={loadRFQs}
        />
      )}
    </div>
  );
}

function getCurrentWeek() {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function getWeekDates(weekString: string) {
  const [year, week] = weekString.split('-W');
  const firstDayOfYear = new Date(parseInt(year), 0, 1);
  const firstWeekDay = firstDayOfYear.getDay();
  
  // Calculate first day of selected week
  const startDate = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7 - firstWeekDay);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: startDate.toLocaleDateString('fr-FR'),
    end: endDate.toLocaleDateString('fr-FR')
  };
}