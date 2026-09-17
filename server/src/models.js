import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, role: { type: String, enum: ['student', 'teacher'], default: 'student' }
}, { timestamps: true });
const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, registerNumber: { type: String, required: true, unique: true },
  department: String, year: Number, semester: Number, section: String
});
const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true }, name: { type: String, required: true }, semester: { type: Number, required: true },
  department: { type: String, required: true }, credits: { type: Number, required: true, min: 0.5, max: 20 }, academicYear: String
}, { timestamps: true });
const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  grade: { type: String, enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'U/RA', ''], default: '' }
}, { timestamps: true });
gradeSchema.index({ student: 1, subject: 1 }, { unique: true });
export const User = mongoose.model('User', userSchema);
export const Student = mongoose.model('Student', studentSchema);
export const Subject = mongoose.model('Subject', subjectSchema);
export const Grade = mongoose.model('Grade', gradeSchema);
