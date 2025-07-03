import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number!`,
      },
      set: (v) => v.replace(/\D/g, '').slice(0, 10),
    },
    customerAddress: {
      type: String,
      trim: true,
      maxLength: [200, 'Address cannot exceed 200 characters'],
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: [0, 'Credit balance cannot be negative'],
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
          ref: 'Bills',
          required: function () {
            return this.type === 'credit';
          },
        },
        amount: {
          type: Number,
          required: true,
          validate: {
            validator: function (value) {
              if (this.type === 'credit') {
                return value >= 0.01;
              }
              if (this.type === 'payment') {
                return value <= -0.01;
              }
              return false;
            },
            message: (props) =>
              props.value >= 0
                ? `Credit amount must be at least 0.01, got ${props.value}`
                : `Payment amount must be at least 0.01, got ${Math.abs(props.value)}`,
          },
        },
        description: {
          type: String,
          trim: true,
          maxLength: [100, 'Description cannot exceed 100 characters'],
        },
        type: {
          type: String,
          enum: ['credit', 'payment'],
          required: true,
          default: 'credit',
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
customerSchema.index({ customerName: 'text' });

customerSchema.virtual('formattedPhone').get(function () {
  return this.customerPhone?.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;