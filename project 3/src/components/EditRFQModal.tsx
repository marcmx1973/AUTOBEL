import { useState, useEffect, lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import { fetchRFQ, updateRFQ, type RFQData, type PlanningData, type WorksharingData } from '../lib/supabase';
import { TEAMS, ROUND_OPTIONS, PHASE_STATUS_OPTIONS } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import { useMasterData } from '../hooks/useMasterData';
import { useRFQ } from '../hooks/useRFQ';
import { validateRFQForm, validateWorksharing } from '../utils/validation';

// Lazy load form sections
const PlanningSection = lazy(() => import('./RFQForm/PlanningSection'));
const WorksharingSection = lazy(() => import('./RFQForm/WorksharingSection'));

type EditRFQModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rfqId: string;
  onUpdate: () => void;
};

export default function EditRFQModal({ isOpen, onClose, rfqId, onUpdate }: EditRFQModalProps) {
  const { masterData, loading: loadingMasterData } = useMasterData();
  const { rfq, loading: loadingRFQ } = useRFQ(rfqId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedOEM, setSelectedOEM] = useState<string>('');
  const [lastSavedData, setLastSavedData] = useState<string>('');

  const [formData, setFormData] = useState<RFQData>({
    reference: '',
    round: '',
    opportunity: '',
    customer: '',
    program: '',
    workpackage: '',
    due_date: '',
    internal_customer: '',
    proposal_leader: '',
    phase_status: 'PROSPECT',
    total_qty_to_quote: 0
  });

  const [planningDates, setPlanningDates] = useState<{
    [key: string]: { planned: string; actual: string };
  }>({
    BLU: { planned: '', actual: '' },
    PIN: { planned: '', actual: '' },
    EOQ: { planned: '', actual: '' },
    GRE: { planned: '', actual: '' },
    RED: { planned: '', actual: '' }
  });

  const [worksharingLines, setWorksharingLines] = useState<{
    process: string;
    plant: string;
    qty_to_quote: number;
  }[]>([]);

  // Load initial data
  useEffect(() => {
    if (rfq) {
      const newFormData = {
        reference: rfq.reference,
        round: rfq.round,
        opportunity: rfq.opportunity,
        customer: rfq.customer,
        program: rfq.program,
        workpackage: rfq.workpackage || '',
        due_date: rfq.due_date || '',
        internal_customer: rfq.internal_customer || '',
        proposal_leader: rfq.proposal_leader || '',
        phase_status: rfq.phase_status,
        total_qty_to_quote: rfq.total_qty_to_quote
      };

      setFormData(newFormData);
      setLastSavedData(JSON.stringify({
        formData: newFormData,
        planningDates: planningDates,
        worksharingLines: worksharingLines
      }));

      // Set planning dates
      const newPlanningDates = { ...planningDates };
      rfq.rfq_planning.forEach((plan: any) => {
        if (plan.team in newPlanningDates) {
          newPlanningDates[plan.team] = {
            planned: plan.planned_date || '',
            actual: plan.actual_date || ''
          };
        }
      });
      setPlanningDates(newPlanningDates);

      // Set worksharing lines
      setWorksharingLines(
        rfq.rfq_worksharing.map((ws: any) => ({
          process: ws.process,
          plant: ws.plant,
          qty_to_quote: ws.qty_to_quote
        }))
      );

      // Set OEM if program exists
      if (rfq.program && masterData) {
        const selectedProgram = masterData.PROGRAM.find(p => p.PROGRAM_NAME === rfq.program);
        setSelectedOEM(selectedProgram?.OEM_NAME || '');
      }
    }
  }, [rfq, masterData]);

  // Auto-save effect
  useEffect(() => {
    const currentData = JSON.stringify({
      formData,
      planningDates,
      worksharingLines
    });

    if (currentData !== lastSavedData) {
      const saveTimeout = setTimeout(async () => {
        const errors = validateRFQForm(formData);
        if (errors.length > 0) return;

        if (!validateWorksharing(worksharingLines, formData.total_qty_to_quote)) return;

        try {
          setSaving(true);
          setError(null);

          const planningData: PlanningData[] = Object.entries(planningDates)
            .filter(([_, dates]) => dates.planned || dates.actual)
            .map(([team, dates]) => ({
              team,
              planned_date: dates.planned || null,
              actual_date: dates.actual || null
            }));

          const worksharingData: WorksharingData[] = worksharingLines
            .filter(line => line.process && line.plant && line.qty_to_quote > 0)
            .map(line => ({
              process: line.process,
              plant: line.plant,
              qty_to_quote: line.qty_to_quote
            }));

          await updateRFQ({
            id: rfqId,
            rfqData: formData,
            planningData,
            worksharingData
          });

          setLastSavedData(currentData);
          onUpdate();
        } catch (error) {
          console.error('Error saving RFQ:', error);
          setError(error instanceof Error ? error.message : 'Failed to save changes');
        } finally {
          setSaving(false);
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(saveTimeout);
    }
  }, [formData, planningDates, worksharingLines]);

  const handleDateChange = (team: string, type: string, value: string) => {
    setPlanningDates(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [type]: value
      }
    }));
  };

  const handleAddWorksharingLine = () => {
    if (worksharingLines.length >= 8) {
      alert('Maximum 8 lines allowed');
      return;
    }
    setWorksharingLines(prev => [...prev, { process: '', plant: '', qty_to_quote: 0 }]);
  };

  const handleUpdateWorksharingLine = (index: number, field: string, value: any) => {
    setWorksharingLines(prev => prev.map((line, i) => 
      i === index ? { ...line, [field]: value } : line
    ));
  };

  const handleRemoveWorksharingLine = (index: number) => {
    setWorksharingLines(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  if (loadingMasterData || loadingRFQ) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit {formData.reference}
            </h3>
            {saving && (
              <span className="text-sm text-gray-500">
                Saving...
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Main Content */}
      <form className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col gap-1 p-4">
          {/* General Information Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">General Information</h2>
            
            <div className="grid grid-cols-12 gap-x-4 gap-y-2">
              {/* First Row */}
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-600">
                  Reference
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  required
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600">
                  Round
                </label>
                <select
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  required
                >
                  <option value="">Select round</option>
                  {ROUND_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-600">
                  Opportunity
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={formData.opportunity}
                  onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  required
                />
              </div>

              {/* Second Row */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-600">
                  Customer
                </label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  required
                >
                  <option value="">Select customer</option>
                  {masterData?.CUSTOMER.map((customer) => (
                    <option key={customer.id} value={customer.CUSTOMER_NAME}>
                      {customer.CUSTOMER_NAME}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600">
                  Program
                </label>
                <select
                  value={formData.program}
                  onChange={(e) => {
                    const selectedProgram = masterData?.PROGRAM.find(p => p.PROGRAM_NAME === e.target.value);
                    setFormData({ ...formData, program: e.target.value });
                    setSelectedOEM(selectedProgram?.OEM_NAME || '');
                  }}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  required
                >
                  <option value="">Select program</option>
                  {masterData?.PROGRAM.map((program) => (
                    <option key={program.id} value={program.PROGRAM_NAME}>
                      {program.PROGRAM_NAME}
                    </option>
                  ))}
                </select>
              </div>
              {selectedOEM && (
                <div className="col-span-3 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-700">
                    {selectedOEM}
                  </span>
                </div>
              )}

              {/* Third Row */}
              <div className="col-span-7">
                <label className="block text-xs font-medium text-gray-600">
                  Workpackage
                </label>
                <input
                  type="text"
                  value={formData.workpackage}
                  onChange={(e) => setFormData({ ...formData, workpackage: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-600">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                />
              </div>

              {/* Fourth Row */}
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-600">
                  Internal Customer
                </label>
                <select
                  value={formData.internal_customer || ''}
                  onChange={(e) => setFormData({ ...formData, internal_customer: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">Select internal customer</option>
                  {masterData?.STAKEHOLDER
                    .filter(s => ['BD', 'KAM', 'CXO', 'VP'].includes(s.ROLE))
                    .map((stakeholder) => (
                      <option key={stakeholder.id} value={stakeholder.STAKEHOLDER_NAME}>
                        {stakeholder.STAKEHOLDER_NAME} ({stakeholder.ROLE})
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-600">
                  Proposal Leader
                </label>
                <select
                  value={formData.proposal_leader || ''}
                  onChange={(e) => setFormData({ ...formData, proposal_leader: e.target.value })}
                  className="w-full h-8 px-2 text-sm rounded border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                >
                  <option value="">Select proposal leader</option>
                  {masterData?.STAKEHOLDER
                    .filter(s => ['PROPOSAL', 'COSTING', 'VP'].includes(s.ROLE))
                    .map((stakeholder) => (
                      <option key={stakeholder.id} value={stakeholder.STAKEHOLDER_NAME}>
                        {stakeholder.STAKEHOLDER_NAME} ({stakeholder.ROLE})
                      </option>
                    ))}
                </select>
              </div>

              {/* Phase Status */}
              <div className="col-span-12">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phase Status
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {PHASE_STATUS_OPTIONS.map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="phaseStatus"
                        value={status}
                        checked={formData.phase_status === status}
                        onChange={(e) => setFormData({ ...formData, phase_status: e.target.value })}
                        className="text-emerald-500 focus:ring-emerald-500 h-3 w-3"
                      />
                      <span className="text-xs text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Planning and Worksharing Container */}
          <div className="flex-1 grid grid-rows-[1fr,1fr] gap-1 min-h-0">
            {/* Planning Section */}
            <Suspense fallback={<LoadingSpinner />}>
              {masterData && (
                <div className="row-span-1 min-h-0">
                  <PlanningSection
                    planningDates={planningDates}
                    onDateChange={handleDateChange}
                  />
                </div>
              )}
            </Suspense>

            {/* Worksharing Section */}
            <Suspense fallback={<LoadingSpinner />}>
              {masterData && (
                <div className="row-span-1 min-h-0">
                  <WorksharingSection
                    masterData={masterData}
                    worksharingLines={worksharingLines}
                    totalQtyToQuote={formData.total_qty_to_quote}
                    onAddLine={handleAddWorksharingLine}
                    onUpdateLine={handleUpdateWorksharingLine}
                    onRemoveLine={handleRemoveWorksharingLine}
                  />
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </form>
    </div>
  );
}