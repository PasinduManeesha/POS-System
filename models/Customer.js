import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    
    customerPhone: { 
        type: String, 
        required: true,
        validate: {
          validator: function(v) {
            return /\d{10}/.test(v);
          },
          message: props => `${props.value} is not a valid phone number!`
        },
        set: v => v.replace(/\D/g, '') // Auto-sanitize on save
      },

    customerAddress: { type: String,}
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;