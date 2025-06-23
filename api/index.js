const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // <-- Add this line

// Load Supabase details from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());

app.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, created_at');
  if (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } else {
    res.json(data);
  }
});

app.get('/', (req, res) => {
  res.send('API is running!');
});

app.listen(3001, () => {
  console.log('API listening on port 3001');
});
//link to test : http://localhost:3001/users
