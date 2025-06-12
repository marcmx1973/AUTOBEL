export const TEAMS = {
  BLU: { name: 'Blue team', color: 'bg-blue-100 text-blue-800' },
  PIN: { name: 'Pink team', color: 'bg-pink-100 text-pink-800' },
  EOQ: { name: 'End of quotation', color: 'bg-gray-100 text-gray-800' },
  GRE: { name: 'Green Team', color: 'bg-green-100 text-green-800' },
  RED: { name: 'Red Team', color: 'bg-red-100 text-red-800' }
} as const;

export const ROUND_OPTIONS = ['NEW', 'SES', 'RFI', 'RFQ-1', 'RFQ-2', 'RFQ-3', 'BAFO', 'RENEWAL', 'INTERNAL'] as const;

export const PHASE_STATUS_OPTIONS = [
  'PROSPECT',
  'PROPOSAL',
  'NEGOTIATION',
  'LOST',
  'AWARDED',
  'STANDBY',
  'CANCELED',
  'CLOSED'
] as const;

export const STATUS_COLORS = {
  AWARDED: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  PROPOSAL: 'bg-blue-100 text-blue-800',
  STANDBY: 'bg-orange-100 text-orange-800',
  PROSPECT: 'bg-purple-100 text-purple-800',
  NEGOTIATION: 'bg-yellow-100 text-yellow-800',
  CANCELED: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-gray-100 text-gray-800'
} as const;