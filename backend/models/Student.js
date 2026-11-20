// Student model: students sign up themselves from the app
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      uppercase: true, // 2503a51133 is saved as 2503A51133
      trim: true,
    },
    batch: {
      type: Number,
      required: [true, "Batch number is required"],
      min: [1, "Batch must be 1 or more"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    // Used on "Forgot password": the student answers this to set a new password
    securityQuestion: {
      type: String,
      trim: true,
    },
    securityAnswer: {
      type: String, // saved hashed, like the password
      select: false, // never sent back in any API response
    },
    // Wrong answers on "Forgot password" (locked for 15 min after 5 wrong tries)
    resetFailCount: { type: Number, default: 0 },
    resetLockedUntil: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Hash the password before saving (only when it is new or changed)
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Answers are compared in lower case without extra spaces ("  Hyderabad " = "hyderabad")
const cleanAnswer = (answer) => String(answer || "").trim().toLowerCase().replace(/\s+/g, " ");

// Hash the security answer before saving (only when it is new or changed)
studentSchema.pre("save", async function (next) {
  if (!this.isModified("securityAnswer") || !this.securityAnswer) return next();
  const salt = await bcrypt.genSalt(10);
  this.securityAnswer = await bcrypt.hash(cleanAnswer(this.securityAnswer), salt);
  next();
});

// Check an answer (load the student with .select("+securityAnswer") first)
studentSchema.methods.matchAnswer = function (answer) {
  if (!this.securityAnswer) return false;
  return bcrypt.compare(cleanAnswer(answer), this.securityAnswer);
};

// Check a plain password against the hashed one (used at login)
studentSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
