import { createClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type RFQ = {
  id: string;
  reference: string;
  round: string;
  opportunity: string;
  customer: string;
  program: string;
  workpackage?: string;
  due_date?: string;
  internal_customer?: string;
  proposal_leader?: string;
  phase_status: string;
  total_qty_to_quote: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  rfq_planning: any[];
  rfq_worksharing: any[];
};

export type RFQData = {
  id?: string;
  reference: string;
  round: string;
  opportunity: string;
  customer: string;
  program: string;
  workpackage?: string;
  due_date?: string;
  internal_customer?: string;
  proposal_leader?: string;
  phase_status: string;
  total_qty_to_quote: number;
};

export type PlanningData = {
  id?: string;
  team: string;
  planned_date?: string | null;
  actual_date?: string | null;
};

export type WorksharingData = {
  id?: string;
  process: string;
  plant: string;
  qty_to_quote: number;
};

export type RFQComment = {
  id: string;
  rfq_id: string;
  comment: string;
  created_at: string;
  created_by: string;
  user_email?: string;
};

// Error handling
const handleSupabaseError = (error: PostgrestError | null, context: string) => {
  if (!error) return null;
  
  console.error(`${context}:`, error);
  
  switch (error.code) {
    case '23505':
      return `A record with this reference already exists`;
    case '23503':
      return `Invalid reference to related data`;
    case '23514':
      return `Data validation failed: ${error.message}`;
    case '42P01':
      return `Database table not found. Please ensure the database is properly set up`;
    default:
      return error.message || 'An unexpected database error occurred';
  }
};

// Fetch single RFQ with comprehensive error handling
export const fetchRFQ = async (id: string): Promise<RFQ> => {
  try {
    const { data, error } = await supabase
      .from('rfq')
      .select(`
        *,
        rfq_planning (*),
        rfq_worksharing (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      const errorMessage = handleSupabaseError(error, 'Error fetching RFQ');
      throw new Error(errorMessage || 'Failed to fetch RFQ');
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRFQ:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching the RFQ');
  }
};

// Fetch RFQs with comprehensive error handling
export const fetchRFQs = async (): Promise<RFQ[]> => {
  try {
    const { data, error } = await supabase
      .from('rfq')
      .select(`
        *,
        rfq_planning (*),
        rfq_worksharing (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const errorMessage = handleSupabaseError(error, 'Error fetching RFQs');
      throw new Error(errorMessage || 'Failed to fetch RFQs');
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRFQs:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching RFQs');
  }
};

// Save RFQ with comprehensive error handling
export const saveRFQ = async ({
  rfqData,
  planningData,
  worksharingData
}: {
  rfqData: RFQData;
  planningData: PlanningData[];
  worksharingData: WorksharingData[];
}): Promise<RFQ> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: rfq, error: rfqError } = await supabase
      .from('rfq')
      .insert({
        ...rfqData,
        created_by: user.id
      })
      .select()
      .single();

    if (rfqError) {
      const errorMessage = handleSupabaseError(rfqError, 'RFQ insertion error');
      throw new Error(errorMessage || 'Failed to create RFQ');
    }
    if (!rfq) {
      throw new Error('RFQ creation failed: No data returned');
    }

    if (planningData.length > 0) {
      const { error: planningError } = await supabase
        .from('rfq_planning')
        .insert(
          planningData.map(plan => ({
            ...plan,
            rfq_id: rfq.id
          }))
        );

      if (planningError) {
        const errorMessage = handleSupabaseError(planningError, 'Planning data insertion error');
        throw new Error(errorMessage || 'Failed to create planning data');
      }
    }

    if (worksharingData.length > 0) {
      const { error: worksharingError } = await supabase
        .from('rfq_worksharing')
        .insert(
          worksharingData.map(ws => ({
            ...ws,
            rfq_id: rfq.id
          }))
        );

      if (worksharingError) {
        const errorMessage = handleSupabaseError(worksharingError, 'Worksharing data insertion error');
        throw new Error(errorMessage || 'Failed to create worksharing data');
      }
    }

    return rfq;
  } catch (error) {
    console.error('Error in saveRFQ:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while saving the RFQ');
  }
};

// Update RFQ with comprehensive error handling
export const updateRFQ = async ({
  id,
  rfqData,
  planningData,
  worksharingData
}: {
  id: string;
  rfqData: RFQData;
  planningData: PlanningData[];
  worksharingData: WorksharingData[];
}) => {
  try {
    // Update RFQ
    const { error: rfqError } = await supabase
      .from('rfq')
      .update({
        reference: rfqData.reference,
        round: rfqData.round,
        opportunity: rfqData.opportunity,
        customer: rfqData.customer,
        program: rfqData.program,
        workpackage: rfqData.workpackage,
        due_date: rfqData.due_date,
        internal_customer: rfqData.internal_customer,
        proposal_leader: rfqData.proposal_leader,
        phase_status: rfqData.phase_status,
        total_qty_to_quote: rfqData.total_qty_to_quote,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (rfqError) {
      const errorMessage = handleSupabaseError(rfqError, 'RFQ update error');
      throw new Error(errorMessage || 'Failed to update RFQ');
    }

    // Delete existing planning data
    const { error: deletePlanningError } = await supabase
      .from('rfq_planning')
      .delete()
      .eq('rfq_id', id);

    if (deletePlanningError) {
      const errorMessage = handleSupabaseError(deletePlanningError, 'Error deleting planning data');
      throw new Error(errorMessage || 'Failed to update planning data');
    }

    // Insert new planning data
    if (planningData.length > 0) {
      const { error: planningError } = await supabase
        .from('rfq_planning')
        .insert(planningData.map(plan => ({
          ...plan,
          rfq_id: id
        })));

      if (planningError) {
        const errorMessage = handleSupabaseError(planningError, 'Planning data update error');
        throw new Error(errorMessage || 'Failed to update planning data');
      }
    }

    // Delete existing worksharing data
    const { error: deleteWorksharingError } = await supabase
      .from('rfq_worksharing')
      .delete()
      .eq('rfq_id', id);

    if (deleteWorksharingError) {
      const errorMessage = handleSupabaseError(deleteWorksharingError, 'Error deleting worksharing data');
      throw new Error(errorMessage || 'Failed to update worksharing data');
    }

    // Insert new worksharing data
    if (worksharingData.length > 0) {
      const { error: worksharingError } = await supabase
        .from('rfq_worksharing')
        .insert(worksharingData.map(ws => ({
          ...ws,
          rfq_id: id
        })));

      if (worksharingError) {
        const errorMessage = handleSupabaseError(worksharingError, 'Worksharing data update error');
        throw new Error(errorMessage || 'Failed to update worksharing data');
      }
    }

    return { id };
  } catch (error) {
    console.error('Error in updateRFQ:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while updating the RFQ');
  }
};

// Delete RFQ with comprehensive error handling
export const deleteRFQ = async (id: string) => {
  try {
    const { error } = await supabase
      .from('rfq')
      .delete()
      .eq('id', id);

    if (error) {
      const errorMessage = handleSupabaseError(error, 'Error deleting RFQ');
      throw new Error(errorMessage || 'Failed to delete RFQ');
    }
  } catch (error) {
    console.error('Error in deleteRFQ:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting the RFQ');
  }
};

// Fetch RFQ comments
export const fetchRFQComments = async (rfqId: string): Promise<RFQComment[]> => {
  try {
    const { data, error } = await supabase
      .from('rfq_comments_with_users')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('created_at', { ascending: false });

    if (error) {
      const errorMessage = handleSupabaseError(error, 'Error fetching comments');
      throw new Error(errorMessage || 'Failed to fetch comments');
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRFQComments:', error);
    throw error;
  }
};

// Add RFQ comment
export const addRFQComment = async (rfqId: string, comment: string): Promise<RFQComment> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('rfq_comments')
      .insert([{
        rfq_id: rfqId,
        comment,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      const errorMessage = handleSupabaseError(error, 'Error adding comment');
      throw new Error(errorMessage || 'Failed to add comment');
    }

    return data;
  } catch (error) {
    console.error('Error in addRFQComment:', error);
    throw error;
  }
};

// Export other existing functions...
export * from './masterData';
export * from './planning';
export * from './capacity';