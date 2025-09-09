import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*",   // Or restrict to SAP BAS URL
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));
const PORT = 3000;

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//Company
// Auth: Signup
app.post("/auth/company/signup", async (req, res) => {
  try {
    const { name, email, password, website, phone, company } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO companies (name, email, password, website, phone, company ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [name, email, hashedPassword, website, phone, company]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Login
app.post("/auth/company/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM companies WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid password" });

    delete user["password"];
    const token = "token"; //generateToken(user);
    res.json({ success: true, token: token, value: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Jobs
app.post("/addjobs", async (req, res) => {
  try {
    const { title, description, company_id } = req.body;
    const result = await pool.query(
      "INSERT INTO jobs (title, description, company_id) VALUES ($1, $2, $3) RETURNING id",
      [title, description, company_id]
    );
    res.json({ success: true, jobs: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Get Jobs
app.get("/jobs/:id", async (req, res) => {
  try {
    const companyId =  req.params.id;
    const result = await pool.query("SELECT id, title, description, created_at FROM jobs WHERE company_id=$1", [
      companyId
    ]);
    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Questions
app.post("/question", async (req, res) => {
  try {
    const {
      job_id,
      question_text,
      question_type,
      company_id,
      difficulty,
      created_by,
      options,
      answers
    } = req.body;
    const result = await pool.query(
      "INSERT INTO questions (job_id, question_text, question_type, company_id, difficulty, created_by, options, answers ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        job_id,
        question_text,
        question_type,
        company_id,
        difficulty,
        created_by,
        options,
        answers
      ]
    );
    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/question/:job_id", async (req, res) => {
  try {
    const job_id = req.params.job_id;
    const result = await pool.query("SELECT * FROM questions WHERE job_id=$1", [
      job_id,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Job not found" });

    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Candidates
app.post("/candidate", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      skills,
      experience,
      location 
    } = req.body;
    const result = await pool.query(
      "INSERT INTO candidates (name, email, password, phone, skills, experience, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        name,
        email,
        password,
        phone,
        skills,
        experience,
        location 
      ]
    );
    res.json({ success: true, test: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Tests
app.post("/test", async (req, res) => {
  try {
    const {
      job_post_id,
      candidate_id
    } = req.body;
    const result = await pool.query(
      "INSERT INTO tests (job_post_id, candidate_id, status) VALUES ($1, $2, $3) RETURNING id",
      [
        job_post_id,
        candidate_id,
        "CREATED"
      ]
    );
    res.json({ success: true, test: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/test/start/:id", async (req, res) => {
  try {
    const id =  req.params.id;
    const result = await pool.query(
      "UPDATE tests SET start_time = NOW(), status = 'STARTED' WHERE id = $1 RETURNING id",
      [
        id
      ]
    );
    res.json({ success: true, value: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/test/end/:id", async (req, res) => {
  try {
    const id =  req.params.id;
    const result = await pool.query(
      "UPDATE tests SET end_time = NOW(), status = 'ENDED' WHERE id = $1 RETURNING id",
      [
        id
      ]
    );
    res.json({ success: true, value: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// app.get('/', (req, res)=>{
//     res.status(200);
//     res.send("Welcome to root URL of Server");
// });

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
