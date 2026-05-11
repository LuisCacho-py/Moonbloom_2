// ─── Modelo User ──────────────────────────────────────────────────────────
// Sprint 3: hashing automático de contraseñas con bcrypt + comparePassword.

import mongoose, { Document, Model, Types } from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: "user" | "admin";
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  email: {
    type: String,
    required: [true, "El correo electrónico es obligatorio"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Ingresa un correo electrónico válido"]
  },
  password: {
    type: String,
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  googleId: {
    type: String,
    index: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  createdAt: { type: Date, default: Date.now }
});

// Hashea la contraseña antes de guardar
// @ts-ignore — los overloads de pre() en Mongoose v9 son problemáticos con TS
userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compara contraseña en login
userSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

// Nunca exponer el hash al serializar
userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;