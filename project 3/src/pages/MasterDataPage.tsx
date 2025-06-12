import { useState, useEffect } from 'react';
import { Factory, Users, Database, Building2, Building, Briefcase, UserCircle, Users2, LayoutDashboard, Menu, Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DeleteModal from '../components/common/DeleteModal';

// Types
type MasterDataItem = {
  id: string;
  [key: string]: any;
};

const masterDataTables = [
  { name: 'oem', displayName: 'OEM', icon: <Factory size={20} />, columns: ['name', 'abbreviation', 'country'] },
  { name: 'program', displayName: 'Program', icon: <LayoutDashboard size={20} />, columns: ['name', 'oem_id'] },
  { name: 'customer', displayName: 'Customer', icon: <Users size={20} />, columns: ['name', 'abbreviation', 'country'] },
  { name: 'process', displayName: 'Process', icon: <Database size={20} />, columns: ['name', 'description'] },
  { name: 'division', displayName: 'Division', icon: <Users2 size={20} />, columns: ['name', 'abbreviation'] },
  { name: 'site', displayName: 'Site', icon: <Building2 size={20} />, columns: ['name', 'division_id'] },
  { name: 'plant', displayName: 'Plant', icon: <Building size={20} />, columns: ['name', 'site_id'] },
  { name: 'existing_process', displayName: 'Existing Process', icon: <Database size={20} />, columns: ['process_id', 'plant_id'] },
  { name: 'department', displayName: 'Department', icon: <Briefcase size={20} />, columns: ['name'] },
  { name: 'role', displayName: 'Role', icon: <UserCircle size={20} />, columns: ['name'] },
  { name: 'stakeholder', displayName: 'Stakeholder', icon: <Users2 size={20} />, columns: ['name', 'department_id', 'plant_id', 'role_id'] }
];

export default function MasterDataPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [masterData, setMasterData] = useState<{ [key: string]: MasterDataItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referencedData, setReferencedData] = useState<{ [key: string]: { value: string, label: string }[] }>({});
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: MasterDataItem | null;
    dependencies?: { table: string; count: number; }[];
  }>({
    isOpen: false,
    item: null
  });

  useEffect(() => {
    loadMasterData();
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable && isEditing) {
      loadReferencedData();
    }
  }, [selectedTable, isEditing]);

  const loadMasterData = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      let query = supabase.from(selectedTable);

      // Add joins for foreign keys
      switch (selectedTable) {
        case 'program':
          query = query.select(`*, oem:oem_id (name)`);
          break;
        case 'site':
          query = query.select(`*, division:division_id (name)`);
          break;
        case 'plant':
          query = query.select(`*, site:site_id (name)`);
          break;
        case 'existing_process':
          query = query.select(`*, process:process_id (name), plant:plant_id (name)`);
          break;
        case 'stakeholder':
          query = query.select(`*, department:department_id (name), plant:plant_id (name), role:role_id (name)`);
          break;
        default:
          query = query.select('*');
      }

      const { data, error } = await query;

      if (error) throw error;

      setMasterData(prev => ({
        ...prev,
        [selectedTable]: data || []
      }));
    } catch (err) {
      console.error('Error loading master data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadReferencedData = async () => {
    if (!selectedTable) return;

    const table = masterDataTables.find(t => t.name === selectedTable);
    if (!table) return;

    const referenceColumns = table.columns.filter(col => col.endsWith('_id'));
    
    try {
      const referencedDataPromises = referenceColumns.map(async (column) => {
        const referencedTable = column.replace('_id', '');
        const { data, error } = await supabase
          .from(referencedTable)
          .select('id, name');

        if (error) throw error;

        return {
          column,
          data: data.map(item => ({
            value: item.id,
            label: item.name
          }))
        };
      });

      const results = await Promise.all(referencedDataPromises);
      
      const newReferencedData: { [key: string]: { value: string, label: string }[] } = {};
      results.forEach(({ column, data }) => {
        newReferencedData[column] = data;
      });

      setReferencedData(newReferencedData);
    } catch (error) {
      console.error('Error loading referenced data:', error);
      setError('Failed to load referenced data');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTable) return;

    try {
      const formData = new FormData(event.currentTarget);
      const data: { [key: string]: string } = {};
      
      masterDataTables
        .find(t => t.name === selectedTable)
        ?.columns.forEach(column => {
          data[column] = formData.get(column) as string;
        });

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from(selectedTable)
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from(selectedTable)
          .insert([data]);

        if (error) throw error;
      }

      await loadMasterData();
      setIsEditing(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving data:', error);
      setError('Failed to save data');
    }
  };

  const handleDelete = async (item: MasterDataItem) => {
    if (!selectedTable) return;

    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      await loadMasterData();
      setDeleteModal({ isOpen: false, item: null });
    } catch (error) {
      console.error('Error deleting data:', error);
      setError('Failed to delete data');
    }
  };

  const handleEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    setIsEditing(true);
  };

  const renderForm = () => {
    if (!selectedTable) return null;

    const table = masterDataTables.find(t => t.name === selectedTable);
    if (!table) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold">
              {editingItem ? 'Edit' : 'Add New'} {table.displayName}
            </h3>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingItem(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {table.columns.map((column) => {
              const isReference = column.endsWith('_id');
              return (
                <div key={column} className="mb-6">
                  <label
                    htmlFor={column}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {column.replace(/_/g, ' ').replace('id', '').trim()}
                  </label>
                  {isReference ? (
                    <select
                      id={column}
                      name={column}
                      defaultValue={editingItem?.[column] || ''}
                      className="mt-1 block w-full h-12 rounded-md border-2 border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 bg-white text-gray-900"
                      required
                    >
                      <option value="">Select {column.replace('_id', '')}</option>
                      {referencedData[column]?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id={column}
                      name={column}
                      defaultValue={editingItem?.[column] || ''}
                      className="mt-1 block w-full h-12 rounded-md border-2 border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 bg-white text-gray-900 px-4"
                      required
                    />
                  )}
                </div>
              );
            })}

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!selectedTable) return null;

    const tableInfo = masterDataTables.find(t => t.name === selectedTable);
    if (!tableInfo) return null;

    const tableData = masterData[selectedTable] || [];

    // Function to get display value for a field
    const getDisplayValue = (item: any, column: string) => {
      switch (column) {
        case 'oem_id':
          return item.oem?.name || '';
        case 'division_id':
          return item.division?.name || '';
        case 'site_id':
          return item.site?.name || '';
        case 'process_id':
          return item.process?.name || '';
        case 'plant_id':
          return item.plant?.name || '';
        case 'department_id':
          return item.department?.name || '';
        case 'role_id':
          return item.role?.name || '';
        default:
          return item[column];
      }
    };

    // Function to get display name for a column
    const getColumnDisplayName = (column: string) => {
      switch (column) {
        case 'oem_id':
          return 'OEM';
        case 'division_id':
          return 'Division';
        case 'site_id':
          return 'Site';
        case 'process_id':
          return 'Process';
        case 'plant_id':
          return 'Plant';
        case 'department_id':
          return 'Department';
        case 'role_id':
          return 'Role';
        default:
          return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{tableInfo.displayName}</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus size={20} className="mr-2" />
            Add New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableInfo.columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {getColumnDisplayName(column)}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {tableInfo.columns.map((column) => (
                      <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDisplayValue(item, column)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, item })}
                        className="text-red-600 hover:text-red-900"
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
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-emerald-800 text-white transition-all duration-300 ease-in-out`}>
        <div className="p-4 flex items-center justify-between">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Master Data</h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-emerald-700 rounded"
          >
            <Menu size={24} />
          </button>
        </div>
        <nav className="mt-4">
          {masterDataTables.map((table, index) => (
            <button
              key={index}
              onClick={() => setSelectedTable(table.name)}
              className={`w-full flex items-center px-4 py-3 text-gray-100 hover:bg-emerald-700 transition-colors duration-200 ${
                selectedTable === table.name ? 'bg-emerald-700' : ''
              }`}
            >
              <span className="mr-3">{table.icon}</span>
              <span className={`${!isSidebarOpen && 'hidden'}`}>{table.displayName}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          {selectedTable ? renderTable() : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterDataTables.map((table, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedTable(table.name)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg mr-4">
                      {table.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{table.displayName}</h3>
                  </div>
                  <p className="text-gray-600">Manage {table.displayName.toLowerCase()} master data</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Form */}
      {isEditing && renderForm()}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={() => deleteModal.item && handleDelete(deleteModal.item)}
        dependencies={deleteModal.dependencies}
        itemName={deleteModal.item ? deleteModal.item[masterDataTables.find(t => t.name === selectedTable)?.columns[0] || ''] : ''}
      />
    </div>
  );
}