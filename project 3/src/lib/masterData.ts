import { supabase } from './supabase';
import type { MasterDataType } from '../types';

// Fetch master data
export const fetchMasterData = async (): Promise<MasterDataType> => {
  try {
    // Fetch OEM data
    const { data: oemData, error: oemError } = await supabase
      .from('oem')
      .select('id, name, abbreviation, country');
    if (oemError) throw oemError;

    // Fetch Program data with OEM name
    const { data: programData, error: programError } = await supabase
      .from('program')
      .select(`
        id,
        name,
        oem:oem_id (name)
      `);
    if (programError) throw programError;

    // Fetch Customer data
    const { data: customerData, error: customerError } = await supabase
      .from('customer')
      .select('id, name, abbreviation, country');
    if (customerError) throw customerError;

    // Fetch Process data
    const { data: processData, error: processError } = await supabase
      .from('process')
      .select('id, name, description');
    if (processError) throw processError;

    // Fetch Division data
    const { data: divisionData, error: divisionError } = await supabase
      .from('division')
      .select('id, name, abbreviation');
    if (divisionError) throw divisionError;

    // Fetch Site data with Division name
    const { data: siteData, error: siteError } = await supabase
      .from('site')
      .select(`
        id,
        name,
        division:division_id (name)
      `);
    if (siteError) throw siteError;

    // Fetch Plant data with Site name
    const { data: plantData, error: plantError } = await supabase
      .from('plant')
      .select(`
        id,
        name,
        site:site_id (name)
      `);
    if (plantError) throw plantError;

    // Fetch Existing Process data
    const { data: existingProcessData, error: existingProcessError } = await supabase
      .from('existing_process')
      .select(`
        id,
        process:process_id (name),
        plant:plant_id (name)
      `);
    if (existingProcessError) throw existingProcessError;

    // Fetch Department data
    const { data: departmentData, error: departmentError } = await supabase
      .from('department')
      .select('id, name');
    if (departmentError) throw departmentError;

    // Fetch Role data
    const { data: roleData, error: roleError } = await supabase
      .from('role')
      .select('id, name');
    if (roleError) throw roleError;

    // Fetch Stakeholder data
    const { data: stakeholderData, error: stakeholderError } = await supabase
      .from('stakeholder')
      .select(`
        id,
        name,
        department:department_id (name),
        plant:plant_id (name),
        role:role_id (name)
      `);
    if (stakeholderError) throw stakeholderError;

    // Format the data to match the expected structure
    return {
      OEM: oemData?.map(oem => ({
        id: oem.id,
        OEM_NAME: oem.name,
        OEM_ABB: oem.abbreviation,
        COUNTRY: oem.country
      })) || [],
      PROGRAM: programData?.map(program => ({
        id: program.id,
        PROGRAM_NAME: program.name,
        OEM_NAME: program.oem?.name || ''
      })) || [],
      CUSTOMER: customerData?.map(customer => ({
        id: customer.id,
        CUSTOMER_NAME: customer.name,
        CUSTOMER_ABB: customer.abbreviation,
        COUNTRY: customer.country
      })) || [],
      PROCESS: processData?.map(process => ({
        id: process.id,
        STANDARD_PROCESS: process.name,
        PROCESS_DESCRIPTION: process.description || ''
      })) || [],
      'GROUP DIVISION': divisionData?.map(division => ({
        id: division.id,
        DIVISION_NAME: division.name,
        DIVISION_ABB: division.abbreviation
      })) || [],
      SITE: siteData?.map(site => ({
        id: site.id,
        SITE_NAME: site.name,
        DIVISION_NAME: site.division?.name || ''
      })) || [],
      PLANT: plantData?.map(plant => ({
        id: plant.id,
        PLANT_NAME: plant.name,
        SITE_NAME: plant.site?.name || ''
      })) || [],
      'EXISTING PROCESS': existingProcessData?.map(ep => ({
        id: ep.id,
        STANDARD_PROCESS: ep.process?.name || '',
        PLANT_NAME: ep.plant?.name || ''
      })) || [],
      DEPARTMENT: departmentData?.map(dept => ({
        id: dept.id,
        DEPARTMENT: dept.name
      })) || [],
      ROLE: roleData?.map(role => ({
        id: role.id,
        ROLE: role.name
      })) || [],
      STAKEHOLDER: stakeholderData?.map(stakeholder => ({
        id: stakeholder.id,
        STAKEHOLDER_NAME: stakeholder.name,
        DEPARTMENT: stakeholder.department?.name || '',
        PLANT_NAME: stakeholder.plant?.name || '',
        ROLE: stakeholder.role?.name || ''
      })) || []
    };
  } catch (error) {
    console.error('Error fetching master data:', error);
    throw error;
  }
};