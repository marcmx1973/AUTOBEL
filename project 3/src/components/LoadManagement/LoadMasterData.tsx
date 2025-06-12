import { useState, useEffect } from 'react';
import { useMasterData } from '../../hooks/useMasterData';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Pencil, Save, Trash2 } from 'lucide-react';
import { fetchPlanningSteps, savePlanningStep, updatePlanningStep, deletePlanningStep } from '../../lib/supabase';
import { generateUUID } from '../../utils/uuid';
import type { PlanningStep } from '../../types';

const TABS = [
  { id: 'general', name: 'General' },
  { id: 'planning-steps', name: 'Planning Steps' }
] as const;

const PLANNING_STEPS = ['BLU', 'PIN', 'EOQ', 'GRE', 'RED'] as const;

export default function LoadMasterData() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('general');
  const { masterData, loading: loadingMasterData } = useMasterData();
  const [planningSteps, setPlanningSteps] = useState<(PlanningStep & { isEditing?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load planning steps
  useEffect(() => {
    const loadPlanningSteps = async () => {
      try {
        setLoading(true);
        const steps = await fetchPlanningSteps();
        setPlanningSteps(steps.map(step => ({ ...step, isEditing: false })));
      } catch (error) {
        console.error('Error loading planning steps:', error);
        setError('Failed to load planning steps');
      } finally {
        setLoading(false);
      }
    };

    loadPlanningSteps();
  }, []);

  const handlePlanningStepChange = (id: string, field: keyof PlanningStep, value: string) => {
    setPlanningSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const addPlanningStep = () => {
    setPlanningSteps(prev => [
      ...prev,
      {
        id: generateUUID(),
        name: '',
        role_in_charge: '',
        starting_step: 'BLU',
        end_step: 'RED',
        created_at: new Date().toISOString(),
        created_by: '',
        updated_at: new Date().toISOString(),
        isEditing: true
      }
    ]);
  };

  const handleSave = async (step: PlanningStep & { isEditing?: boolean }) => {
    try {
      setError(null);
      const { isEditing, ...stepData } = step;
      
      if (step.id.includes('-')) {
        // New step
        const savedStep = await savePlanningStep({
          name: step.name,
          role_in_charge: step.role_in_charge,
          starting_step: step.starting_step,
          end_step: step.end_step
        });
        setPlanningSteps(prev => prev.map(s => 
          s.id === step.id ? { ...savedStep, isEditing: false } : s
        ));
      } else {
        // Existing step
        await updatePlanningStep(step.id, stepData);
        setPlanningSteps(prev => prev.map(s => 
          s.id === step.id ? { ...s, isEditing: false } : s
        ));
      }
    } catch (error) {
      console.error('Error saving planning step:', error);
      setError('Failed to save planning step');
    }
  };

  const handleEdit = (id: string) => {
    setPlanningSteps(prev => prev.map(step => 
      step.id === id ? { ...step, isEditing: true } : step
    ));
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deletePlanningStep(id);
      setPlanningSteps(prev => prev.filter(step => step.id !== id));
    } catch (error) {
      console.error('Error deleting planning step:', error);
      setError('Failed to delete planning step');
    }
  };

  if (loadingMasterData || !masterData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-8 font-medium text-sm border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'general' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Master Data for Load & Capacity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Working Calendar</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Working Days/Week</span>
                      <span className="text-sm font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shifts/Day</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hours/Shift</span>
                      <span className="text-sm font-medium">8</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Types</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Machines</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Operators</span>
                      <span className="text-sm font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tools</span>
                      <span className="text-sm font-medium">48</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Efficiency Factors</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">OEE</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className="text-sm font-medium">90%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Availability</span>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Planning Steps</h2>
                <button
                  onClick={addPlanningStep}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                >
                  Add Step
                </button>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Planning Step Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role in Charge
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Starting Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {planningSteps.map((step) => (
                        <tr key={step.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={step.name}
                              onChange={(e) => handlePlanningStepChange(step.id, 'name', e.target.value)}
                              disabled={!step.isEditing}
                              className={`w-full px-2 py-1 text-sm rounded border ${
                                step.isEditing 
                                  ? 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={step.role_in_charge}
                              onChange={(e) => handlePlanningStepChange(step.id, 'role_in_charge', e.target.value)}
                              disabled={!step.isEditing}
                              className={`w-full px-2 py-1 text-sm rounded border ${
                                step.isEditing 
                                  ? 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            >
                              <option value="">Select role</option>
                              {masterData.ROLE.map((role) => (
                                <option key={role.id} value={role.ROLE}>
                                  {role.ROLE}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={step.starting_step}
                              onChange={(e) => handlePlanningStepChange(step.id, 'starting_step', e.target.value)}
                              disabled={!step.isEditing}
                              className={`w-full px-2 py-1 text-sm rounded border ${
                                step.isEditing 
                                  ? 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            >
                              {PLANNING_STEPS.map((step) => (
                                <option key={step} value={step}>
                                  {step}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={step.end_step}
                              onChange={(e) => handlePlanningStepChange(step.id, 'end_step', e.target.value)}
                              disabled={!step.isEditing}
                              className={`w-full px-2 py-1 text-sm rounded border ${
                                step.isEditing 
                                  ? 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            >
                              {PLANNING_STEPS.map((step) => (
                                <option key={step} value={step}>
                                  {step}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {step.isEditing ? (
                                <button
                                  onClick={() => handleSave(step)}
                                  className="text-emerald-600 hover:text-emerald-700"
                                  title="Save"
                                >
                                  <Save size={18} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(step.id)}
                                    className="text-gray-600 hover:text-gray-700"
                                    title="Edit"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(step.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {planningSteps.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No planning steps defined. Click "Add Step" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}