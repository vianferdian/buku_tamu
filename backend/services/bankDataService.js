const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
dotenv.config();

/**
 * Helper to fetch dynamic API configs from database settings with env fallbacks.
 */
const getApiConfig = async () => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['bank_data_api_url', 'bank_data_client_id', 'bank_data_client_secret']
        }
      }
    });

    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    return {
      url: config.bank_data_api_url || process.env.BANK_DATA_API_URL || 'https://data.vianferdian.web.id/api/v1',
      clientId: config.bank_data_client_id || process.env.BANK_DATA_CLIENT_ID || 'BUKU_TAMU_FHOB',
      clientSecret: config.bank_data_client_secret || process.env.BANK_DATA_CLIENT_SECRET || '0bgDccJDHpt6sOTS4u31SM84NZ78jFIQ'
    };
  } catch (err) {
    console.error('Error loading api config from DB, using env fallback:', err);
    return {
      url: process.env.BANK_DATA_API_URL || 'https://data.vianferdian.web.id/api/v1',
      clientId: process.env.BANK_DATA_CLIENT_ID || 'BUKU_TAMU_FHOB',
      clientSecret: process.env.BANK_DATA_CLIENT_SECRET || '0bgDccJDHpt6sOTS4u31SM84NZ78jFIQ'
    };
  }
};

/**
 * Search students from bank-data API.
 * @param {string} search 
 * @returns {Promise<Array>}
 */
const fetchStudents = async (search = '') => {
  try {
    const config = await getApiConfig();
    const url = new URL(`${config.url}/students`);
    if (search) {
      url.searchParams.append('search', search);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId,
        'X-Client-Secret': config.clientSecret,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error in fetchStudents from bank-data:', error);
    throw error;
  }
};

/**
 * Fetch all employees from bank-data API (handling pagination).
 * @returns {Promise<Array>}
 */
const fetchAllEmployees = async () => {
  try {
    const config = await getApiConfig();
    let allEmployees = [];
    let page = 1;
    let lastPage = 1;

    do {
      const url = new URL(`${config.url}/employees`);
      url.searchParams.append('page', page.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': config.clientId,
          'X-Client-Secret': config.clientSecret,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        allEmployees = allEmployees.concat(result.data);
        if (result.meta && result.meta.last_page) {
          lastPage = result.meta.last_page;
        } else {
          break;
        }
      } else {
        break;
      }
      page++;
    } while (page <= lastPage);

    return allEmployees;
  } catch (error) {
    console.error('Error in fetchAllEmployees from bank-data:', error);
    throw error;
  }
};

module.exports = {
  fetchStudents,
  fetchAllEmployees,
};
