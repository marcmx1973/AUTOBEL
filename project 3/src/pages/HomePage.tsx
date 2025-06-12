import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileSpreadsheet, FilePlus, Calendar } from 'lucide-react';
import { fetchRFQs } from '../lib/supabase';
import { STATUS_COLORS } from '../constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SECTIONS = [
  {
    name: 'Quotation Funnel',
    description: 'Monitor and manage your quotation pipeline',
    href: '/quotation',
    icon: <FileSpreadsheet className="h-8 w-8 text-yellow-600" />,
    bgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=500&h=300',
    stats: [
      { label: 'Prospect', value: '0' },
      { label: 'Proposal', value: '0' },
      { label: 'Awarded', value: '0' }
    ]
  },
  {
    name: 'Weekly Review',
    description: 'Track and review quotation progress and status updates',
    href: '/weekly-review',
    icon: <Calendar className="h-8 w-8 text-blue-600" />,
    bgImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=500&h=300',
    stats: [
      { label: 'This Week', value: '0' },
      { label: 'Next Week', value: '0' }
    ]
  },
  {
    name: 'Capacity Load Analysis',
    description: 'Analyze and manage plant capacity and workload distribution',
    href: '/load-management',
    icon: <BarChart3 className="h-8 w-8 text-emerald-600" />,
    bgImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500&h=300',
    stats: [
      { label: 'Active RFQs', value: '0' },
      { label: 'Total Load', value: '0h' }
    ]
  },
  {
    name: 'New Quote',
    description: 'Create and submit new quotation requests',
    href: '/new-quote',
    icon: <FilePlus className="h-8 w-8 text-purple-600" />,
    bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500&h=300',
    stats: [
      { label: 'Today', value: '0' },
      { label: 'This Week', value: '0' }
    ]
  }
];

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    [key: string]: { [key: string]: number | string }
  }>({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const rfqs = await fetchRFQs();
      
      // Calculate dates
      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay() + 1);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(thisWeekStart.getDate() + 7);

      // Calculate total load
      const activeRFQs = rfqs.filter(rfq => 
        ['PROSPECT', 'PROPOSAL', 'NEGOTIATION'].includes(rfq.phase_status)
      );
      const totalLoad = activeRFQs.reduce((sum, rfq) => 
        sum + rfq.rfq_worksharing.reduce((wSum, ws) => wSum + ws.qty_to_quote, 0), 0
      );

      // Calculate stats
      const newStats = {
        'Quotation Funnel': {
          'Prospect': rfqs.filter(rfq => rfq.phase_status === 'PROSPECT').length,
          'Proposal': rfqs.filter(rfq => rfq.phase_status === 'PROPOSAL').length,
          'Awarded': rfqs.filter(rfq => rfq.phase_status === 'AWARDED').length
        },
        'Weekly Review': {
          'This Week': rfqs.filter(rfq => {
            const dueDate = new Date(rfq.due_date);
            return dueDate >= thisWeekStart && dueDate < nextWeekStart;
          }).length,
          'Next Week': rfqs.filter(rfq => {
            const dueDate = new Date(rfq.due_date);
            return dueDate >= nextWeekStart && dueDate < new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          }).length
        },
        'Capacity Load Analysis': {
          'Active RFQs': activeRFQs.length,
          'Total Load': `${totalLoad}h`
        },
        'New Quote': {
          'Today': rfqs.filter(rfq => new Date(rfq.created_at).toDateString() === today.toDateString()).length,
          'This Week': rfqs.filter(rfq => new Date(rfq.created_at) >= thisWeekStart).length
        }
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quotation Management System
          </h1>
          <p className="text-lg text-gray-600">
            Monitor your quotations, track capacity, and manage workload
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SECTIONS.map((section) => (
            <Link
              key={section.name}
              to={section.href}
              className="group relative bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={section.bgImage}
                  alt=""
                  className="w-full h-full object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-white/80"></div>
              </div>

              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {section.icon}
                  <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
                </div>
                <p className="text-gray-600 mb-6">{section.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {section.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats[section.name]?.[stat.label] ?? stat.value}
                      </div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Status Indicators for Quotation Funnel */}
                {section.name === 'Quotation Funnel' && (
                  <div className="mt-6 flex space-x-2">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                      <span
                        key={status}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}