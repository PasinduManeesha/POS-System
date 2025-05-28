import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number!`,
      },
      set: (v) => v.replace(/\D/g, "").slice(0, 10),
    },
    customerAddress: {
      type: String,
      trim: true,
      maxLength: [200, "Address cannot exceed 200 characters"],
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: [0, "Credit balance cannot be negative"],
      set: (v) => parseFloat(v.toFixed(2)),
    },
    creditHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
          immutable: true,
        },
        billId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Bills",
          required: function () {
            return this.type === "credit";
          },
        },
        amount: {
          type: Number,
          required: true,
          min: [0.01, "Amount must be at least 0.01"],
        },
        description: {
          type: String,
          trim: true,
          maxLength: [100, "Description cannot exceed 100 characters"],
        },
        type: {
          type: String,
          enum: ["credit", "payment"],
          required: true,
          default: "credit",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

customerSchema.index({ customerPhone: 1 }, { unique: true });
customerSchema.index({ customerName: "text" });

customerSchema.virtual("formattedPhone").get(function () {
  return this.customerPhone?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
});

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;