const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase project details:
const supabaseUrl = 'https://xqgojtkyfewmirozikok.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZ29qdGt5ZmV3bWlyb3ppa29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzk3MDgsImV4cCI6MjA2NTkxNTcwOH0.wMqWY37Liri5ZmGAxENJRq1SXsYLEMb6WXJ6uM_VxUs'; // <-- Put your anon key here!
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

app.listen(3001, () => {
  console.log('API listening on port 3001');
});
