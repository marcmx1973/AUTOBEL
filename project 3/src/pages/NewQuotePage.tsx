import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building2, Database, Plus, X } from 'lucide-react';
import { saveRFQ, fetchMasterData, type MasterDataType } from '../lib/supabase';
import { ROUND_OPTIONS, PHASE_STATUS_OPTIONS, TEAMS } from '../constants';
import { validateRFQForm, validateWorksharing } from '../utils/validation';
import { calculateRemainingDays, validateDateOrder } from '../utils/date';
import type { RFQData, PlanningData, WorksharingData } from '../lib/supabase';

export default function NewQuotePage() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [masterData, setMasterData] = useState<MasterDataType | null>(null);
  const [selectedOEM, setSelectedOEM] = useState<string>('');
  
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

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const data = await fetchMasterData();
        setMasterData(data);
      } catch (error) {
        console.error('Error loading master data:', error);
        setErrorMessage('Failed to load master data');
      }
    };

    loadMasterData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      const errors = validateRFQForm(formData);
      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      if (!validateWorksharing(worksharingLines, formData.total_qty_to_quote)) {
        throw new Error('Total worksharing quantities cannot exceed RFQ total quantity');
      }

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

      await saveRFQ({
        rfqData: formData,
        planningData,
        worksharingData
      });

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/quotation');
      }, 2000);

    } catch (error) {
      console.error('Error saving quote:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while saving the quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (team: string, type: 'planned' | 'actual', value: string) => {
    if (value && !validateDateOrder(team, value, type, ['BLU', 'PIN', 'EOQ', 'GRE', 'RED'], planningDates)) {
      alert(`The ${type} date must be after the previous team's date${type === 'actual' ? ' and cannot be in the future' : ''}`);
      return;
    }

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

  const handleRemoveWorksharingLine = (index: number) => {
    setWorksharingLines(prev => prev.filter((_, i) => i !== index));
  };

  const getAvailablePlants = (process: string) => {
    if (!masterData) return [];
    return masterData['EXISTING PROCESS']
      .filter(ep => ep.STANDARD_PROCESS === process)
      .map(ep => ep.PLANT_NAME);
  };

  const calculateRemainingQty = () => {
    const totalAllocated = worksharingLines.reduce((sum, line) => sum + line.qty_to_quote, 0);
    return formData.total_qty_to_quote - totalAllocated;
  };

  if (!masterData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <p className="text-lg text-emerald-600">Quote saved successfully!</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="h-[calc(100vh-4rem)] p-4">
        <div className="h-full grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            {/* General Information */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
                </div>
                <span className="text-sm font-medium text-emerald-600">
                  {new Date().toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                {/* First Row */}
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600">Reference</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-600">Round</label>
                  <select
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    required
                  >
                    <option value="">Select round</option>
                    {ROUND_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600">Opportunity</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={formData.opportunity}
                    onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    required
                  />
                </div>

                {/* Second Row */}
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600">Customer</label>
                  <select
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    required
                  >
                    <option value="">Select customer</option>
                    {masterData.CUSTOMER.map((customer) => (
                      <option key={customer.id} value={customer.CUSTOMER_NAME}>
                        {customer.CUSTOMER_NAME}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-600">Program</label>
                  <select
                    value={formData.program}
                    onChange={(e) => {
                      const selectedProgram = masterData.PROGRAM.find(p => p.PROGRAM_NAME === e.target.value);
                      setFormData({ ...formData, program: e.target.value });
                      setSelectedOEM(selectedProgram?.OEM_NAME || '');
                    }}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    required
                  >
                    <option value="">Select program</option>
                    {masterData.PROGRAM.map((program) => (
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
                  <label className="block text-xs font-medium text-gray-600">Workpackage</label>
                  <input
                    type="text"
                    value={formData.workpackage}
                    onChange={(e) => setFormData({ ...formData, workpackage: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>

                {/* Fourth Row */}
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-600">Internal Customer</label>
                  <select
                    value={formData.internal_customer || ''}
                    onChange={(e) => setFormData({ ...formData, internal_customer: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  >
                    <option value="">Select internal customer</option>
                    {masterData.STAKEHOLDER
                      .filter(s => ['BD', 'KAM', 'CXO'].includes(s.ROLE))
                      .map((stakeholder) => (
                        <option key={stakeholder.id} value={stakeholder.STAKEHOLDER_NAME}>
                          {stakeholder.STAKEHOLDER_NAME} ({stakeholder.ROLE})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-gray-600">Proposal Leader</label>
                  <select
                    value={formData.proposal_leader || ''}
                    onChange={(e) => setFormData({ ...formData, proposal_leader: e.target.value })}
                    className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                  >
                    <option value="">Select proposal leader</option>
                    {masterData.STAKEHOLDER
                      .filter(s => ['PROPOSAL', 'COSTING'].includes(s.ROLE))
                      .map((stakeholder) => (
                        <option key={stakeholder.id} value={stakeholder.STAKEHOLDER_NAME}>
                          {stakeholder.STAKEHOLDER_NAME} ({stakeholder.ROLE})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Phase Status */}
                <div className="col-span-12">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phase Status</label>
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

            {/* Planning Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Planning</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                        DATE CATEGORY
                      </th>
                      {Object.entries(TEAMS).map(([key, team]) => (
                        <th key={key} className={`px-2 py-1 text-left text-xs font-medium ${team.color}`}>
                          {team.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Planned Dates */}
                    <tr>
                      <td className="px-2 py-1 font-medium text-xs text-gray-500">Planned</td>
                      {Object.keys(TEAMS).map((team) => (
                        <td key={team} className="px-2 py-1">
                          <input
                            type="date"
                            value={planningDates[team].planned}
                            onChange={(e) => handleDateChange(team, 'planned', e.target.value)}
                            className="w-full h-7 px-1 text-xs rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                          />
                        </td>
                      ))}
                    </tr>
                    {/* Actual Dates */}
                    <tr>
                      <td className="px-2 py-1 font-medium text-xs text-gray-500">Actual</td>
                      {Object.keys(TEAMS).map((team) => (
                        <td key={team} className="px-2 py-1">
                          <input
                            type="date"
                            value={planningDates[team].actual}
                            onChange={(e) => handleDateChange(team, 'actual', e.target.value)}
                            className="w-full h-7 px-1 text-xs rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                          />
                        </td>
                      ))}
                    </tr>
                    {/* Remaining Days */}
                    <tr>
                      <td className="px-2 py-1 font-medium text-xs text-gray-500">Days</td>
                      {Object.keys(TEAMS).map((team) => {
                        const remainingDays = calculateRemainingDays(
                          planningDates[team].planned,
                          planningDates[team].actual
                        );
                        return (
                          <td key={team} className="px-2 py-1">
                            {remainingDays !== null && (
                              <span className={`text-sm font-bold ${
                                remainingDays > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {remainingDays}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Worksharing */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-900">Worksharing</h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-50 px-3 py-1 rounded">
                  <label className="text-sm font-medium text-gray-700">
                    Total Qty:
                    <input
                      type="number"
                      min="0"
                      value={formData.total_qty_to_quote}
                      onChange={(e) => setFormData({ ...formData, total_qty_to_quote: parseInt(e.target.value) || 0 })}
                      className="ml-2 w-24 px-2 py-1 rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAddWorksharingLine}
                  className="flex items-center px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </button>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-2 py-1 bg-gray-50 rounded text-xs font-medium text-gray-600">
                <div className="col-span-5">Process</div>
                <div className="col-span-5">Plant</div>
                <div className="col-span-2">Qty</div>
              </div>

              {/* Lines */}
              {worksharingLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center group">
                  <div className="col-span-5">
                    <select
                      value={line.process}
                      onChange={(e) => {
                        const newLines = [...worksharingLines];
                        newLines[index] = { ...line, process: e.target.value, plant: '' };
                        setWorksharingLines(newLines);
                      }}
                      className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    >
                      <option value="">Select process</option>
                      {masterData.PROCESS.map((process) => (
                        <option key={process.id} value={process.STANDARD_PROCESS}>
                          {process.STANDARD_PROCESS}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5">
                    <select
                      value={line.plant}
                      onChange={(e) => {
                        const newLines = [...worksharingLines];
                        newLines[index] = { ...line, plant: e.target.value };
                        setWorksharingLines(newLines);
                      }}
                      className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                      disabled={!line.process}
                    >
                      <option value="">Select plant</option>
                      {getAvailablePlants(line.process).map((plant) => (
                        <option key={plant} value={plant}>
                          {plant}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      value={line.qty_to_quote}
                      onChange={(e) => {
                        const newLines = [...worksharingLines];
                        newLines[index] = { ...line, qty_to_quote: parseInt(e.target.value) || 0 };
                        setWorksharingLines(newLines);
                      }}
                      className="w-full h-8 px-2 text-sm rounded border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveWorksharingLine(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="flex justify-between items-center pt-2 mt-2 border-t text-sm">
                <span className="font-medium text-gray-600">Remaining:</span>
                <span className={`font-bold ${calculateRemainingQty() !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {calculateRemainingQty()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}