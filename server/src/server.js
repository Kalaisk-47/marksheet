import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Student, Subject, Grade } from './models.js';
import { GRADE_POINTS, calculateSemester, calculateCumulative } from './gpa.js';
import { requireAuth, requireTeacher, signToken } from './auth.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' })); app.use(express.json());
const port = process.env.PORT || 4000;
const profile = async (userId) => Student.findOne({ user: userId }).populate('user', 'name email');
async function rowsFor(studentId, semester) {
  const subjects = await Subject.find({ semester }).sort({ code: 1 });
  const grades = await Grade.find({ student: studentId, subject: { $in: subjects.map((s) => s._id) } });
  return subjects.map((subject) => ({ subject, grade: grades.find((g) => String(g.subject) === String(subject._id))?.grade || '' }));
}
app.get('/api/health', (_, res) => res.json({ ok: true, service: 'marksheet-api' }));
app.post('/api/auth/register', async (req, res) => {
  try { const { name, email, password, registerNumber, department, year, semester, section } = req.body;
    if (!name || !email || !password || !registerNumber) return res.status(400).json({ message: 'Name, email, password and register number are required' });
    const user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10), role: 'student' });
    const student = await Student.create({ user: user._id, registerNumber, department, year, semester, section });
    res.status(201).json({ token: signToken(user), role: user.role, profile: { ...student.toObject(), name, email } });
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email or register number already exists' : e.message }); }
});
app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: signToken(user), role: user.role, profile: user.role === 'student' ? await profile(user._id) : { name: user.name, email: user.email } });
});
app.get('/api/profile', requireAuth, async (req, res) => res.json(await profile(req.auth.id)));
app.get('/api/subjects', requireAuth, async (req, res) => { const student = await profile(req.auth.id); const semester = Number(req.query.semester || student?.semester || 1); res.json(await rowsFor(student?._id, semester)); });
app.get('/api/grades', requireAuth, async (req, res) => { const student = await profile(req.auth.id); const semester = Number(req.query.semester || student.semester || 1); const rows = await rowsFor(student._id, semester); const result = calculateSemester(rows.map(({ subject, grade }) => ({ credits: subject.credits, grade }))); res.json({ semester, rows, result }); });
app.put('/api/grades', requireAuth, async (req, res) => { const student = await profile(req.auth.id); const updates = req.body.grades || []; const allowed = await Subject.find({ _id: { $in: updates.map((g) => g.subject) } });
  for (const update of updates) { if (!allowed.some((s) => String(s._id) === String(update.subject))) continue; await Grade.findOneAndUpdate({ student: student._id, subject: update.subject }, { grade: update.grade }, { upsert: true, new: true }); }
  res.json({ message: 'Grades saved' });
});
app.get('/api/results', requireAuth, async (req, res) => { const student = await profile(req.auth.id); const semesters = [...new Set((await Subject.distinct('semester')).sort((a, b) => a - b))]; const data = []; for (const semester of semesters) { const rows = await rowsFor(student._id, semester); const result = calculateSemester(rows.map(({ subject, grade }) => ({ credits: subject.credits, grade }))); if (result.completed) data.push({ semester, rows, result }); } res.json({ semesters: data, cumulative: calculateCumulative(data.map((item) => item.result)) }); });
app.get('/api/marksheet/:semester', requireAuth, async (req, res) => { const student = await profile(req.auth.id); const semester = Number(req.params.semester); const rows = await rowsFor(student._id, semester); const result = calculateSemester(rows.map(({ subject, grade }) => ({ credits: subject.credits, grade }))); const previous = (await Promise.all((await Subject.distinct('semester')).filter((s) => s < semester).map(async (s) => calculateSemester((await rowsFor(student._id, s)).map(({ subject, grade }) => ({ credits: subject.credits, grade })))))); res.json({ student, semester, rows, result, cumulative: calculateCumulative([result, ...previous]) }); });
app.get('/api/admin/subjects', requireAuth, requireTeacher, async (_, res) => res.json(await Subject.find().sort({ semester: 1, code: 1 })));
app.post('/api/admin/subjects', requireAuth, requireTeacher, async (req, res) => { try { res.status(201).json(await Subject.create(req.body)); } catch (e) { res.status(400).json({ message: e.message }); } });
app.put('/api/admin/subjects/:id', requireAuth, requireTeacher, async (req, res) => { try { res.json(await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { res.status(400).json({ message: e.message }); } });
app.delete('/api/admin/subjects/:id', requireAuth, requireTeacher, async (req, res) => { await Subject.findByIdAndDelete(req.params.id); res.json({ message: 'Subject deleted' }); });
app.get('/api/config/grades', (_, res) => res.json(GRADE_POINTS));
app.use((err, _, res, __) => res.status(500).json({ message: err.message }));
if (process.env.MONGO_URI) mongoose.connect(process.env.MONGO_URI).then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`))).catch((e) => console.error('MongoDB connection failed', e)); else console.warn('MONGO_URI missing. Add server/.env and start MongoDB.');
export default app;
