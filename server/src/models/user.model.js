const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password in default queries
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    // Extensible profile fields initialized for Phase 2
    profile: {
      age: { type: Number, min: 13, max: 120 },
      gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
      height: { type: Number }, // in cm
      weight: { type: Number }, // in kg
      fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
      primaryGoal: { 
        type: String, 
        enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'maintenance'] 
      },
      workoutDaysPerWeek: { type: Number, min: 1, max: 7 },
      preferredWorkoutDuration: { type: Number, min: 10, max: 180 }, // in minutes
      equipment: [{ type: String }],
      preferences: {
        preferredExercises: [{ type: String }],
        dislikedExercises: [{ type: String }],
        preferredWorkoutStyle: { type: String },
      },
      nutritionPreferences: {
        dietaryPreference: { type: String },
        favoriteFoods: [{ type: String }],
        dislikedFoods: [{ type: String }],
        dietaryRestrictions: [{ type: String }],
        cookingTimePreference: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Clean JSON representation
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
