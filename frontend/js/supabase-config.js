const SUPABASE_URL = 'https://nwfqgazpmxlhberzkwxe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZnFnYXpwbXhsaGJlcnprd3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODY1ODksImV4cCI6MjA5Mzk2MjU4OX0.RKhwKhPHLh3mgNQT5cDjWbY0YX1CaAVn1s0xWon5Bmc';

// Khởi tạo Supabase client

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_URL = `${SUPABASE_URL}/functions/v1/flashcard-api`;