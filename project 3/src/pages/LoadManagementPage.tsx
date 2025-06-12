import { useState } from 'react';
import { Menu, BarChart3, Calculator, Database, Settings, Table2 } from 'lucide-react';
import CapacityLoadAnalysis from '../components/LoadManagement/CapacityLoadAnalysis';
import LoadPerUnit from '../components/LoadManagement/LoadPerUnit';
import LoadMasterData from '../components/LoadManagement/LoadMasterData';
import NominalCapacity from '../components/LoadManagement/NominalCapacity';
import LoadTable from '../components/LoadManagement/LoadTable';

const SECTIONS = [
  { id: 'capacity-load', name: 'Capacity-load analysis', icon: <BarChart3 size={20} />, component: CapacityLoadAnalysis },
  { id: 'load-per-unit', name: 'Load per unit (ROM estimate)', icon: <Calculator size={20} />, component: LoadPerUnit },
  { id: 'master-data', name: 'Masterdata for Load & Capa', icon: <Database size={20} />, component: LoadMasterData },
  { id: 'nominal-capacity', name: 'Nominal Capacity', icon: <Settings size={20} />, component: NominalCapacity },
  { id: 'load-table', name: 'Load Table', icon: <Table2 size={20} />, component: LoadTable }
];

export default function LoadManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0].id);

  const CurrentComponent = SECTIONS.find(section => section.id === selectedSection)?.component;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-emerald-800 text-white transition-all duration-300 ease-in-out`}>
        <div className="p-4 flex items-center justify-between">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Load Management</h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-emerald-700 rounded"
          >
            <Menu size={24} />
          </button>
        </div>
        <nav className="mt-4">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`w-full flex items-center px-4 py-3 text-gray-100 hover:bg-emerald-700 transition-colors duration-200 ${
                selectedSection === section.id ? 'bg-emerald-700' : ''
              }`}
            >
              <span className="mr-3">{section.icon}</span>
              <span className={`${!isSidebarOpen && 'hidden'}`}>{section.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {CurrentComponent && <CurrentComponent />}
      </div>
    </div>
  );
}