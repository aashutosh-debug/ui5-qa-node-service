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

app.put("/jobs/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description } = req.body;
    const result = await pool.query(
      "UPDATE jobs SET title = $1, description = $2 WHERE id = $3 RETURNING id",
      [title, description, id]
    );
    res.json({ success: true, jobs: result.rowCount });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

//Get Jobs
app.get("/jobs/:id", async (req, res) => {
  try {
    const companyId =  req.params.id;
    const result = await pool.query("SELECT id, title, description, created_at, company_id FROM jobs WHERE company_id=$1", [
      companyId
    ]);
    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Delete Job
app.get("/job/delete/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    //const client = await pool.connect();
    await client.query("BEGIN");

    await client.query("DELETE FROM jobs WHERE id = $1", [req.params.id]);
    await client.query("DELETE FROM questions WHERE id in (SELECT id FROM questions Where job_id = $1)", [req.params.id]);

    await client.query("COMMIT");
    console.log("Transaction committed!");

    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction rolled back!", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
      "INSERT INTO questions (job_id, question_text, question_type, company_id, difficulty, created_by, options, answers ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
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
    // if (result.rows.length === 0)
    //   return res.status(401).json({ error: "Questions not found" });

    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Delete Questions
app.post("/question/delete", async (req, res) => {
  try {
    const {
      ids
    } = req.body;

    const result = await pool.query("DELETE FROM questions WHERE id = ANY($1::int[]);", [
      ids,
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Candidates
app.post("/auth/candidate/signup", async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO candidates (name, email, password, phone, skills, experience, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        name,
        email,
        hashedPassword,
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

// Auth: Login
app.post("/auth/candidate/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM candidates WHERE email=$1", [
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

//Tests

//Get Candidate Tests List for Candidates
app.get("/test/candidate/:id", async (req, res) => {
  try {
    const candidate_id =  req.params.id;
    const result = await pool.query(`SELECT 
            t.id as test_id,
            t.job_post_id,
            t.candidate_id,
            t.score,
            t.start_time,
            t.end_time,
            t.status,
            j.title,
            j.description,
            c.company
        FROM tests t
        JOIN jobs j 
            ON t.job_post_id = j.id
        JOIN companies c 
            ON j.company_id = c.id
        WHERE t.candidate_id = $1;`,
      [
        candidate_id
      ]
    );
    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//GET Candidates w.r.t Job from Test table
app.get("/getCandidatesForJob/:id", async (req, res) => {
  try {
    const job_id =  req.params.id;
    const result = await pool.query(`
        SELECT 
			      t.id,
            t.job_post_id,
            t.candidate_id,
            t.score,
            t.start_time,
            t.end_time,
            t.status,
            t.candidate_email as email,
            t.created_at,
            c.name,
            c.phone,
            c.experience,
            c.location,
            c.skills
        FROM tests t
        LEFT JOIN candidates c
            ON t.candidate_id = c.id
        WHERE t.job_post_id = $1;`,
      [
        job_id
      ]
    );
    res.json({ success: true, value: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/test", async (req, res) => {

   const {
      job_post_id,
      candidate_email,
    } = req.body;

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    for (const candidateEmail of candidate_email) {
      await client.query(
        `INSERT INTO tests (job_post_id, candidate_id, candidate_email, status) VALUES (
            $1, 
            (SELECT id FROM public.candidates WHERE email = $2) , 
            $2,
            $3
        ) 
        ON CONFLICT DO NOTHING`,  // avoids duplicate assignment
        [job_post_id, candidateEmail, "Initial"]
      );
    }

    await client.query("COMMIT");
    console.log("Candidates assigned successfully ");

    res.json({ success: true });
    } 
    catch (err) {
      await client.query("ROLLBACK");
      console.error("Error assigning candidates", err);
      res.status(500).json({ error: err.message });
    } 
    finally {
      client.release();
    }
});


app.post("/test/deleteCandidates", async (req, res) => {
  try {
     const {
      id
    } = req.body;
    const result = await pool.query(
      "DELETE FROM tests WHERE id = ANY($1::int[]) ",
      [
        id
      ]
    );
    res.json({ success: true });
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

app.post("/submitanswers", async (req, res) => {

  const { candidate_id, answers, testid } = req.body;
  const client = await pool.connect();
  try {

    await client.query("BEGIN");

    for (const ans of answers) {

      const qAns = await client.query(
        `Select answers from questions where id = $1;`,  
        [ans.question_id]
      );

      console.log(qAns.rows[0].answers);
      console.log(ans.selected_options);

      const orgAns = qAns.rows[0].answers;
      let score = 100;

      if (orgAns.length !== ans.selected_options.length || 
        !orgAns.every((val, index) => val === ans.selected_options[index])){
          score = 0;
      }

      // console.log(orgAns.length); //2
      // console.log(ans.selected_options.length); //1
      // console.log(orgAns.every((val, index) => val === ans.selected_options[index]));
      // console.log(score);

      await client.query(
        `INSERT INTO answers (candidate_id, question_id, answer_text, score, test_id) VALUES ($1, $2, $3, $4, $5) 
          ON CONFLICT DO NOTHING`,  // avoids duplicate assignment
        [candidate_id, ans.question_id, ans.selected_options, score, testid]
      );
    }

    const scores = await client.query(
        `Select score from answers where test_id = $1 and candidate_id = $2;`,  
        [testid, candidate_id]
      );

    // console.log("scores.rows[0].score",scores.rows);
    let totalScore = scores.rows.reduce((sum, item) => sum + parseFloat(item.score), 0)/ scores.rows.length;

    await client.query(
        `UPDATE tests SET status = 'Submitted', score = $2, end_time = now() where id = $1;` , 
        [testid, totalScore]
      );

    await client.query("COMMIT");
    console.log("Test Submitted successfully ");

    res.json({ success: true });
    } 
    catch (err) {
      await client.query("ROLLBACK");
      console.error("Error submitting Test", err);
      res.status(500).json({ error: err.message });
    } 
    finally {
      client.release();
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
