import { supabase } from './supabase';

export type NominalCapacity = {
  id: string;
  process_id: string;
  plant_id: string;
  weekly_hours: number;
  created_at: string;
  updated_at: string;
};

export type LoadPerUnit = {
  id: string;
  process_id: string;
  plant_id: string;
  hours_per_unit: number;
  created_at: string;
  updated_at: string;
};

// Nominal Capacity functions
export const fetchNominalCapacities = async (): Promise<NominalCapacity[]> => {
  try {
    const { data, error } = await supabase
      .from('nominal_capacity')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching nominal capacities:', error);
    throw error;
  }
};

export const saveNominalCapacity = async (
  processId: string, 
  plantId: string, 
  weeklyHours: number
): Promise<NominalCapacity> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('nominal_capacity')
      .upsert(
        {
          process_id: processId,
          plant_id: plantId,
          weekly_hours: weeklyHours,
          created_by: user.user.id,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'process_id,plant_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to save nominal capacity');

    return data;
  } catch (error) {
    console.error('Error saving nominal capacity:', error);
    throw error;
  }
};

// Load Per Unit functions
export const fetchLoadPerUnit = async (): Promise<LoadPerUnit[]> => {
  try {
    const { data, error } = await supabase
      .from('load_per_unit')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching load per unit values:', error);
    throw error;
  }
};

export const saveLoadPerUnit = async (
  processId: string, 
  plantId: string, 
  hoursPerUnit: number
): Promise<LoadPerUnit> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('load_per_unit')
      .upsert(
        {
          process_id: processId,
          plant_id: plantId,
          hours_per_unit: hoursPerUnit,
          created_by: user.user.id,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'process_id,plant_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to save load per unit');

    return data;
  } catch (error) {
    console.error('Error saving load per unit:', error);
    throw error;
  }
};