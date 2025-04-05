import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0, // Ensure default is 0 if not provided
  },
});

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
