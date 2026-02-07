const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SECRET_KEY_SUPABASE
);

async function getAllUsers(req, res) {
  try {
    const { data, error } = await supabase.from('Users').select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Error fetching users' });
    }

    console.log('Fetched users:', data);
    res.status(200).json(data); // <- Muy importante
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}

module.exports = {
  getAllUsers
};
